<?php

namespace App\Services;

use App\Core\UploadUnavailableException;

/**
 * Envoi d'une image de produit depuis l'admin.
 *
 * Principe : on ne fait JAMAIS confiance au fichier reçu. Il est contrôlé (taille, type réel lu dans le contenu, dimensions),
 * puis l'image est DÉCODÉE et RÉ-ENCODÉE par GD : seuls les pixels sont conservés. Un script caché dans le fichier, des données
 * ajoutées à la fin, les métadonnées (EXIF, position GPS de la photo) ne survivent pas. Les octets d'origine ne sont jamais stockés.
 *
 * Sortie : WebP (qualité 82) si GD sait l'encoder, sinon JPEG ; sans GD, l'envoi est refusé (UploadUnavailableException, 503).
 * Nom et extension choisis par le serveur (32 caractères aléatoires). Le dossier interdit l'exécution de scripts (.htaccess).
 */
class AdminUploadService
{
    private const MAX_SIZE   = 5 * 1024 * 1024;
    private const ALLOWED    = ['image/jpeg' => IMAGETYPE_JPEG, 'image/png' => IMAGETYPE_PNG, 'image/webp' => IMAGETYPE_WEBP];
    private const UPLOAD_DIR = __DIR__ . '/../../public/uploads/products/';

    // Dimensions : lues dans l'en-tête AVANT de décoder (une image piégée de 20 000 × 20 000 px saturerait la mémoire)
    private const MAX_PIXELS = 24_000_000;
    private const MIN_SIDE   = 100;
    // Le navigateur réduit déjà l'image à 1 600 px avant l'envoi ; le serveur l'applique aussi, pour tout autre envoi
    private const MAX_SIDE   = 1600;

    private const WEBP_QUALITY = 82;
    private const JPEG_QUALITY = 85;

    /** Règles du dossier des images : aucun script exécuté, ni type deviné, ni contenu actif dans une page */
    private const HTACCESS = <<<'HTACCESS'
# Généré par l'API (AdminUploadService) : ne pas modifier à la main, il serait réécrit.
# Aucune exécution de script dans ce dossier
RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phps .phar .cgi .pl .py .sh
RemoveType .php .phtml .php3 .php4 .php5 .php7 .php8 .phps .phar
<FilesMatch "\.(php[0-9]?|phtml|phps|phar|cgi|pl|py|sh|htaccess|html?|svg|js)$">
    Require all denied
</FilesMatch>
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set Content-Security-Policy "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"
</IfModule>

HTACCESS;

    /**
     * Valide l'image reçue, la ré-encode et la stocke. Retourne son adresse relative (uploads/products/…).
     *
     * @throws \InvalidArgumentException  fichier refusé (message destiné à l'administrateur)
     * @throws UploadUnavailableException le serveur ne sait pas traiter les images (GD absent)
     * @throws \RuntimeException          écriture impossible
     */
    public function store(array $file): string
    {
        if (!function_exists('imagecreatetruecolor')) {
            throw new UploadUnavailableException("Le traitement des images n'est pas disponible sur le serveur.");
        }

        $this->checkReception($file);
        $mime = $this->checkType($file['tmp_name']);
        [$width, $height] = $this->checkDimensions($file['tmp_name'], $mime);

        $image = $this->decode($file['tmp_name'], $mime);
        $image = $this->orient($image, $file['tmp_name'], $mime);
        $image = $this->shrink($image);

        return $this->save($image);
    }

    private function checkReception(array $file): void
    {
        $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if (is_array($error) || $error !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException(match (is_array($error) ? -1 : $error) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse 5 Mo.',
                UPLOAD_ERR_NO_FILE                        => 'Aucun fichier reçu.',
                -1                                        => 'Envoyez une seule image à la fois.',
                default                                   => 'Erreur lors de la réception du fichier (code ' . $error . ').',
            });
        }

        // Le fichier doit provenir d'un envoi HTTP (jamais un chemin du serveur glissé dans la requête)
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException('Fichier reçu invalide.');
        }

        if ((int) $file['size'] > self::MAX_SIZE || filesize($file['tmp_name']) > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Le fichier dépasse 5 Mo.');
        }
    }

    /** Type lu dans le CONTENU du fichier (le type et le nom annoncés par le navigateur ne sont pas fiables). */
    private function checkType(string $path): string
    {
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        if (!isset(self::ALLOWED[$mime])) {
            throw new \InvalidArgumentException('Format non autorisé. Utilisez JPG, PNG ou WebP.');
        }

        // WebP animé : refusé (GD ne garderait que la première image, sans prévenir)
        if ($mime === 'image/webp' && str_contains((string) file_get_contents($path, false, null, 0, 4096), 'ANIM')) {
            throw new \InvalidArgumentException('Les images animées ne sont pas acceptées.');
        }

        return $mime;
    }

    /** @return array{0:int, 1:int} largeur, hauteur */
    private function checkDimensions(string $path, string $mime): array
    {
        $info = @getimagesize($path);
        if ($info === false || $info[2] !== self::ALLOWED[$mime]) {
            throw new \InvalidArgumentException("Le fichier n'est pas une image valide.");
        }

        [$width, $height] = $info;

        if ($width < self::MIN_SIDE || $height < self::MIN_SIDE) {
            throw new \InvalidArgumentException('Image trop petite : au moins ' . self::MIN_SIDE . ' × ' . self::MIN_SIDE . ' pixels.');
        }

        if ($width * $height > self::MAX_PIXELS || !$this->fitsInMemory($width, $height)) {
            throw new \InvalidArgumentException("Image trop grande ({$width} × {$height} pixels) : réduisez-la avant de l'envoyer.");
        }

        return [$width, $height];
    }

    /** GD décode environ 5 octets par pixel : on refuse plutôt que de faire planter la requête faute de mémoire. */
    private function fitsInMemory(int $width, int $height): bool
    {
        $limit = $this->bytes((string) ini_get('memory_limit'));

        return $limit <= 0 || memory_get_usage() + $width * $height * 5 + 16 * 1024 * 1024 < $limit;
    }

    private function bytes(string $value): int
    {
        $value = trim($value);
        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g'     => $number * 1024 ** 3,
            'm'     => $number * 1024 ** 2,
            'k'     => $number * 1024,
            default => $number,
        };
    }

    private function decode(string $path, string $mime): \GdImage
    {
        $decoder = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'][$mime];

        $image = function_exists($decoder) ? @$decoder($path) : false;
        if (!$image instanceof \GdImage) {
            throw new \InvalidArgumentException("Le fichier n'est pas une image valide.");
        }

        imagepalettetotruecolor($image);

        return $image;
    }

    /** Photo de téléphone : l'orientation est une métadonnée (EXIF), qui va disparaître : on tourne les pixels avant. */
    private function orient(\GdImage $image, string $path, string $mime): \GdImage
    {
        if ($mime !== 'image/jpeg' || !function_exists('exif_read_data')) {
            return $image;
        }

        $orientation = (int) (@exif_read_data($path)['Orientation'] ?? 1);
        $angle = [3 => 180, 6 => -90, 8 => 90][$orientation] ?? 0;

        return $angle === 0 ? $image : (imagerotate($image, $angle, 0) ?: $image);
    }

    /** Côté le plus long ramené à MAX_SIDE, proportions conservées (transparence comprise). */
    private function shrink(\GdImage $image): \GdImage
    {
        $width  = imagesx($image);
        $height = imagesy($image);
        $ratio  = self::MAX_SIDE / max($width, $height);

        if ($ratio >= 1) {
            return $image;
        }

        $newWidth  = max(1, (int) round($width * $ratio));
        $newHeight = max(1, (int) round($height * $ratio));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $resized;
    }

    /** Encode en WebP (ou JPEG) dans un fichier temporaire, puis le renomme : jamais de fichier à moitié écrit visible. */
    private function save(\GdImage $image): string
    {
        $this->prepareDirectory();

        $webp      = function_exists('imagewebp');
        $filename  = 'product_' . bin2hex(random_bytes(16)) . ($webp ? '.webp' : '.jpg');
        $temporary = self::UPLOAD_DIR . '.tmp_' . bin2hex(random_bytes(8));

        if ($webp) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            $written = imagewebp($image, $temporary, self::WEBP_QUALITY);
        } else {
            // JPEG n'a pas de transparence : fond blanc plutôt que noir
            $flat = imagecreatetruecolor(imagesx($image), imagesy($image));
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
            $written = imagejpeg($flat, $temporary, self::JPEG_QUALITY);
        }

        if (!$written || !rename($temporary, self::UPLOAD_DIR . $filename)) {
            @unlink($temporary);
            throw new \RuntimeException('Erreur lors de la sauvegarde du fichier.');
        }

        return 'uploads/products/' . $filename;
    }

    /**
     * Dossier des images, son .htaccess (réécrit s'il diffère : un ancien serveur reçoit ainsi les nouvelles règles)
     * et une page d'index vide (pas de liste des fichiers, même si le serveur l'autorise).
     */
    private function prepareDirectory(): void
    {
        if (!is_dir(self::UPLOAD_DIR) && !mkdir(self::UPLOAD_DIR, 0755, true) && !is_dir(self::UPLOAD_DIR)) {
            throw new \RuntimeException('Erreur lors de la sauvegarde du fichier.');
        }

        $htaccess = self::UPLOAD_DIR . '.htaccess';
        if (!is_file($htaccess) || file_get_contents($htaccess) !== self::HTACCESS) {
            file_put_contents($htaccess, self::HTACCESS);
        }

        if (!is_file(self::UPLOAD_DIR . 'index.html')) {
            file_put_contents(self::UPLOAD_DIR . 'index.html', '');
        }
    }
}
