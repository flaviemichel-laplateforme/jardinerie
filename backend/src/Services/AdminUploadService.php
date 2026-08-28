<?php

namespace App\Services;

class AdminUploadService
{
    private const MAX_SIZE  = 5 * 1024 * 1024;
    private const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp'];
    private const UPLOAD_DIR = __DIR__ . '/../../public/uploads/products/';

    // Aucune fiche produit n'affiche l'image à plus de ~800px de large :
    // inutile de conserver une résolution supérieure, ça n'alourdit que le chargement.
    private const MAX_WIDTH = 1200;
    private const WEBP_QUALITY = 80;

    /**
     * Valide et déplace un fichier uploadé.
     * Retourne l'URL publique relative.
     *
     * @throws \InvalidArgumentException si le fichier est invalide
     * @throws \RuntimeException         si l'écriture échoue
     */
    public function store(array $file): string
    {
        $this->validateSize($file);
        $mimeType = $this->validateMime($file);
        return $this->move($file, $mimeType);
    }

    private function validateSize(array $file): void
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException(
                'Erreur lors de la réception du fichier (code ' . $file['error'] . ').'
            );
        }

        if ($file['size'] > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Le fichier dépasse 5 Mo.');
        }
    }

    private function validateMime(array $file): string
    {
        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, self::ALLOWED, true)) {
            throw new \InvalidArgumentException(
                'Format non autorisé. Utilisez JPG, PNG ou WebP.'
            );
        }

        return $mimeType;
    }

    private function move(array $file, string $mimeType): string
    {
        // On ne promet la conversion WebP que si GD est réellement disponible.
        // Sinon, on retombe sur le format d'origine — le nom du fichier reflète
        // toujours fidèlement son contenu réel, jamais une extension mensongère.
        $canConvertToWebp = function_exists('imagewebp') && match ($mimeType) {
            'image/jpeg' => function_exists('imagecreatefromjpeg'),
            'image/png'  => function_exists('imagecreatefrompng'),
            'image/webp' => function_exists('imagecreatefromwebp'),
        };

        $extension = $canConvertToWebp ? 'webp' : match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        };

        $filename = 'product_' . bin2hex(random_bytes(16)) . '.' . $extension;

        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $path = self::UPLOAD_DIR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $path)) {
            throw new \RuntimeException('Erreur lors de la sauvegarde du fichier.');
        }

        if ($canConvertToWebp) {
            $this->resizeAndConvertToWebp($path, $mimeType);
        }

        return 'uploads/products/' . $filename;
    }

    /**
     * Redimensionne l'image si elle dépasse MAX_WIDTH, et la convertit en WebP
     * (meilleur rapport qualité/poids que JPEG ou PNG, largement supporté par
     * les navigateurs actuels). Écrase le fichier sur place.
     *
     * N'est appelée que si move() a confirmé que GD sait lire ce format et
     * encoder en WebP — pas de risque d'incohérence entre extension et contenu.
     */
    private function resizeAndConvertToWebp(string $path, string $mimeType): void
    {
        try {
            $source = match ($mimeType) {
                'image/jpeg' => imagecreatefromjpeg($path),
                'image/png'  => imagecreatefrompng($path),
                'image/webp' => imagecreatefromwebp($path),
            };

            if ($source === false) {
                return;
            }

            $width  = imagesx($source);
            $height = imagesy($source);

            // On ne redimensionne que si l'image est réellement trop large ;
            // pas besoin d'agrandir une petite image.
            if ($width > self::MAX_WIDTH) {
                $newWidth  = self::MAX_WIDTH;
                $newHeight = (int) round($height * ($newWidth / $width));

                $resized = imagescale($source, $newWidth, $newHeight);
                imagedestroy($source);
                $source = $resized;
            }

            // PNG avec transparence : on la préserve avant l'encodage WebP.
            imagepalettetotruecolor($source);
            imagealphablending($source, true);
            imagesavealpha($source, true);

            imagewebp($source, $path, self::WEBP_QUALITY);
            imagedestroy($source);
        } catch (\Throwable $e) {
            // Le fichier original (déjà sauvegardé, avec la bonne extension) reste utilisable.
        }
    }
}
