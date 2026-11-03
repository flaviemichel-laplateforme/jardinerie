<?php

namespace Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin d'envoi d'image (POST /admin/upload), y compris les tentatives d'attaque : l'image est contrôlée puis ré-encodée,
 * seuls ses pixels sont conservés (ni code caché, ni métadonnées), et le dossier des images n'exécute aucun script.
 */
#[Group('integration')]
class AdminUploadApiTest extends AdminApiTestCase
{
    private const UPLOAD_DIR = __DIR__ . '/../public/uploads/products/';

    /** Écrit un fichier temporaire et l'envoie sous la clé « image ». */
    private function upload(string $bytes, string $mime = 'image/png', string $name = 'photo.png'): array
    {
        $path = tempnam(sys_get_temp_dir(), 'zzup');
        file_put_contents($path, $bytes);

        try {
            return self::$admin->request('POST', '/admin/upload', null, ['image' => new \CURLFile($path, $mime, $name)]);
        } finally {
            @unlink($path);
        }
    }

    /** Fichier stocké (supprimé en fin de classe). */
    private function keep(array $response): string
    {
        $url = $response['body']['data']['url'] ?? '';
        $this->assertNotSame('', $url, $response['raw']);
        self::trackFile($url);

        return __DIR__ . '/../public/' . $url;
    }

    private static function jpegBytes(int $width = 300, int $height = 200): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 200, 120, 40));
        ob_start();
        imagejpeg($image);

        return (string) ob_get_clean();
    }

    /** JPEG avec un bloc EXIF (APP1) contenant une fausse position GPS : ce que produit un téléphone. */
    private static function jpegWithGps(): string
    {
        $jpeg = self::jpegBytes();
        $exif = "Exif\0\0" . 'MM' . "\0\x2a\0\0\0\x08" . 'GPSLatitude=48.8566;GPSLongitude=2.3522;Owner=Zz Secret';
        $app1 = "\xFF\xE1" . pack('n', strlen($exif) + 2) . $exif;

        return substr($jpeg, 0, 2) . $app1 . substr($jpeg, 2); // juste après le marqueur de début (SOI)
    }

    /** En-tête PNG valide annonçant des dimensions énormes, sans les pixels : l'image « piégée » qui saturerait la mémoire. */
    private static function pngClaiming(int $width, int $height): string
    {
        $ihdr = pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0);
        $chunk = fn(string $type, string $data) => pack('N', strlen($data)) . $type . $data . pack('N', crc32($type . $data));

        return "\x89PNG\r\n\x1a\n" . $chunk('IHDR', $ihdr) . $chunk('IDAT', gzcompress(str_repeat("\0", 64))) . $chunk('IEND', '');
    }

    /** WebP animé minimal (en-tête VP8X avec bloc ANIM). */
    private static function animatedWebp(): string
    {
        $vp8x = 'VP8X' . pack('V', 10) . "\x02\0\0\0" . "\x63\0\0" . "\x63\0\0";
        $anim = 'ANIM' . pack('V', 6) . "\0\0\0\0\0\0";
        $body = 'WEBP' . $vp8x . $anim;

        return 'RIFF' . pack('V', strlen($body)) . $body;
    }

    // ------------------------------------------------------------------ envoi accepté

    public function testUneImageValideEstReencodeeEnWebpSousUnNomChoisiParLeServeur(): void
    {
        $response = $this->upload(self::pngBytes(), 'image/png', 'photo-de-vacances.png');

        $this->assertSame(201, $response['status'], $response['raw']);
        $file = $this->keep($response);

        $this->assertMatchesRegularExpression('#^uploads/products/product_[0-9a-f]{32}\.webp$#', $response['body']['data']['url']);
        $this->assertStringNotContainsString('vacances', $response['body']['data']['url'], 'le nom d\'origine n\'est jamais repris');
        $this->assertSame('image/webp', (new \finfo(FILEINFO_MIME_TYPE))->file($file));
    }

    public function testUnJpegEstAussiConvertiEnWebp(): void
    {
        $file = $this->keep($this->upload(self::jpegBytes(), 'image/jpeg', 'a.jpg'));

        $this->assertSame('image/webp', (new \finfo(FILEINFO_MIME_TYPE))->file($file));
    }

    public function testUneImageTropGrandeEstRameneeA1600PixelsSurSonPlusGrandCote(): void
    {
        $landscape = getimagesize($this->keep($this->upload(self::pngBytes(2000, 1000))));
        $portrait  = getimagesize($this->keep($this->upload(self::pngBytes(800, 3200))));

        $this->assertSame([1600, 800], [$landscape[0], $landscape[1]]);
        $this->assertSame([400, 1600], [$portrait[0], $portrait[1]]);
    }

    public function testUneImageDeTailleRaisonnableGardeSesDimensions(): void
    {
        $this->assertSame(640, getimagesize($this->keep($this->upload(self::pngBytes(640, 480))))[0]);
    }

    public function testLeTypeEstLuDansLeContenuEtPasDansLeTypeAnnonce(): void
    {
        // Un PNG annoncé « text/plain » avec une extension .txt est reconnu par son contenu
        $response = $this->upload(self::pngBytes(), 'text/plain', 'photo.txt');

        $this->assertSame(201, $response['status'], $response['raw']);
        $this->keep($response);
    }

    // ------------------------------------------------------------------ ré-encodage : rien d'autre que les pixels ne survit

    public function testDuCodeAjouteApresUneVraieImageDisparaitDuFichierStocke(): void
    {
        $response = $this->upload(self::pngBytes() . '<?php system($_GET["c"]); ?>', 'image/png', 'shell.php.png');

        $this->assertSame(201, $response['status'], $response['raw']);
        $this->assertStringNotContainsString('<?php', (string) file_get_contents($this->keep($response)));
    }

    public function testLesMetadonneesEtLaPositionGpsSontRetirees(): void
    {
        $original = self::jpegWithGps();
        $this->assertStringContainsString('GPSLatitude', $original, 'contrôle du test : la source contient bien les métadonnées');

        $stored = (string) file_get_contents($this->keep($this->upload($original, 'image/jpeg', 'IMG_0001.jpg')));

        $this->assertStringNotContainsString('GPSLatitude', $stored);
        $this->assertStringNotContainsString('Zz Secret', $stored);
        $this->assertStringNotContainsString('Exif', $stored);
    }

    // ------------------------------------------------------------------ envois refusés

    /** @return array<string, array{0:string, 1:string, 2:string, 3:string}> contenu, type annoncé, nom, message attendu (extrait) */
    public static function refusedFiles(): array
    {
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return [
            'script PHP déguisé en PNG'     => ['<?php echo "pwned"; ?>', 'image/png', 'shell.png', 'Format non autorisé'],
            'SVG avec script'               => ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'image/svg+xml', 'a.svg', 'Format non autorisé'],
            'PDF'                           => ["%PDF-1.4\n1 0 obj\n<<>>\nendobj\n", 'application/pdf', 'a.pdf', 'Format non autorisé'],
            'GIF'                           => [$gif, 'image/gif', 'a.gif', 'Format non autorisé'],
            'HTML'                          => ['<html><body><script>alert(1)</script></body></html>', 'image/png', 'a.png', 'Format non autorisé'],
            'signature PNG suivie de code'  => ["\x89PNG\r\n\x1a\n" . '<?php system($_GET["c"]); ?>', 'image/png', 'a.png', ''],
            'image piégée de 30 mégapixels' => [self::pngClaiming(6000, 5000), 'image/png', 'a.png', 'Image trop grande'],
            'image piégée de 1 milliard de pixels' => [self::pngClaiming(40000, 25000), 'image/png', 'a.png', 'Image trop grande'],
            'image trop petite'             => [self::pngBytes(50, 300), 'image/png', 'a.png', 'Image trop petite'],
            'WebP animé'                    => [self::animatedWebp(), 'image/webp', 'a.webp', ''],
        ];
    }

    #[DataProvider('refusedFiles')]
    public function testUnFichierDangereuxOuInadapteEstRefuseEtNonStocke(string $bytes, string $mime, string $name, string $message): void
    {
        $before = glob(self::UPLOAD_DIR . 'product_*') ?: [];

        $response = $this->upload($bytes, $mime, $name);

        $this->assertSame(400, $response['status'], $response['raw']);
        $this->assertStringContainsString($message, $response['body']['message']);
        $this->assertSame($before, glob(self::UPLOAD_DIR . 'product_*') ?: [], 'aucun fichier ajouté au dossier des images');
        $this->assertSame([], glob(self::UPLOAD_DIR . '.tmp_*') ?: [], 'aucun fichier temporaire laissé');
    }

    public function testUnFichierDePlusDe5MoEstRefuse(): void
    {
        $this->assertSame(400, $this->upload(self::pngBytes() . str_repeat('0', 5 * 1024 * 1024 + 1))['status']);
    }

    public function testSansFichierLaReponseEst400(): void
    {
        $response = self::$admin->request('POST', '/admin/upload', null, ['autre' => 'valeur']);

        $this->assertSame(400, $response['status']);
        $this->assertStringContainsString('Aucun fichier', $response['body']['message']);
    }

    public function testPlusieursFichiersSousLaMemeCleSontRefuses(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'zzup');
        file_put_contents($path, self::pngBytes());

        try {
            $response = self::$admin->request('POST', '/admin/upload', null, [
                'image[0]' => new \CURLFile($path, 'image/png', 'a.png'),
                'image[1]' => new \CURLFile($path, 'image/png', 'b.png'),
            ]);
        } finally {
            @unlink($path);
        }

        $this->assertSame(400, $response['status'], $response['raw']);
    }

    public function testUnEnvoiAuFormatJsonEstRefuse(): void
    {
        // Le contrôle du type de contenu (index.php) refuse le JSON sur cette route avant même le contrôleur
        $this->assertSame(415, self::$admin->post('/admin/upload', ['image' => 'x'])['status']);
    }

    public function testUnClientOuUnVisiteurNePeutPasEnvoyerDImage(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'zzup');
        file_put_contents($path, self::pngBytes());

        try {
            $file = ['image' => new \CURLFile($path, 'image/png', 'a.png')];
            $this->assertSame(403, self::$customer->request('POST', '/admin/upload', null, $file)['status']);
            $this->assertSame(401, self::$visitor->request('POST', '/admin/upload', null, $file)['status']);
        } finally {
            @unlink($path);
        }
    }

    // ------------------------------------------------------------------ dossier des images

    public function testLeDossierEstVerrouilleEtSonHtaccessEstRemisAJour(): void
    {
        // Un ancien .htaccess (version précédente de l'API) est remplacé au prochain envoi
        file_put_contents(self::UPLOAD_DIR . '.htaccess', "# ancienne version\n");

        $this->keep($this->upload(self::pngBytes()));

        $htaccess = (string) file_get_contents(self::UPLOAD_DIR . '.htaccess');
        $this->assertStringContainsString('Require all denied', $htaccess);
        $this->assertStringContainsString('nosniff', $htaccess);
        $this->assertFileExists(self::UPLOAD_DIR . 'index.html', 'pas de liste des fichiers du dossier');
    }

    public function testUnScriptDeposeDansLeDossierNEstPasExecute(): void
    {
        $this->keep($this->upload(self::pngBytes())); // garantit le .htaccess à jour

        foreach (['zz-probe.php', 'zz-probe.phtml', 'zz-probe.html'] as $name) {
            file_put_contents(self::UPLOAD_DIR . $name, '<?php echo "EXECUTE-" . "OK"; ?><script>alert(1)</script>');
            try {
                $response = (new \Tests\Support\ApiClient('http://localhost'))->request('GET', '/uploads/products/' . $name);
            } finally {
                @unlink(self::UPLOAD_DIR . $name);
            }

            $this->assertSame(403, $response['status'], $name);
            $this->assertStringNotContainsString('EXECUTE-OK', $response['raw'], $name);
        }
    }

    public function testLaListeDesFichiersDuDossierNEstPasAccessible(): void
    {
        $response = (new \Tests\Support\ApiClient('http://localhost'))->request('GET', '/uploads/products/');

        $this->assertNotSame(200, $response['status']);
        $this->assertStringNotContainsString('product_', $response['raw']);
    }
}
