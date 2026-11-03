<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin d'envoi d'image (POST /admin/upload). Décrit le comportement ACTUEL avant son durcissement (N4-api-catalogue) :
 * les contrôles de type et de taille sont déjà là, le ré-encodage systématique et les limites de dimensions ne le sont pas encore.
 */
#[Group('integration')]
class AdminUploadApiTest extends AdminApiTestCase
{
    /** Écrit un fichier temporaire et renvoie un champ multipart « image ». */
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

    private function keep(array $response): string
    {
        $url = $response['body']['data']['url'] ?? '';
        $this->assertNotSame('', $url, $response['raw']);
        self::trackFile($url);

        return __DIR__ . '/../public/' . $url;
    }

    public function testUneImageValideEstStockeSousUnNomChoisiParLeServeur(): void
    {
        $response = $this->upload(self::pngBytes());

        $this->assertSame(201, $response['status'], $response['raw']);
        $file = $this->keep($response);

        $this->assertMatchesRegularExpression('#^uploads/products/product_[0-9a-f]{32}\.(webp|png)$#', $response['body']['data']['url']);
        $this->assertStringNotContainsString('photo', $response['body']['data']['url'], 'le nom d\'origine n\'est jamais repris');
        $this->assertFileExists($file);
        $this->assertNotFalse(getimagesize($file), 'le fichier stocké est une image lisible');
    }

    public function testUneImageTropLargeEstReduiteA1200Pixels(): void
    {
        $response = $this->upload(self::pngBytes(2000, 1000));
        $file = $this->keep($response);

        $this->assertSame(201, $response['status']);
        $this->assertSame(1200, getimagesize($file)[0]);
        $this->assertSame(600, getimagesize($file)[1]);
    }

    public function testLeTypeEstLuDansLeContenuEtPasDansLeTypeAnnonce(): void
    {
        // Un fichier PNG annoncé comme « text/plain » avec une extension .txt est quand même reconnu par son contenu
        $response = $this->upload(self::pngBytes(), 'text/plain', 'photo.txt');

        $this->assertSame(201, $response['status'], $response['raw']);
        $this->keep($response);
    }

    public function testUnScriptPhpDeguiseEnImageEstRefuse(): void
    {
        $response = $this->upload('<?php echo "pwned"; ?>', 'image/png', 'shell.png');

        $this->assertSame(400, $response['status']);
        $this->assertSame('Format non autorisé. Utilisez JPG, PNG ou WebP.', $response['body']['message']);
    }

    public function testUnSvgEstRefuse(): void
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

        $this->assertSame(400, $this->upload($svg, 'image/svg+xml', 'dessin.svg')['status']);
    }

    public function testUnPdfEstRefuse(): void
    {
        $this->assertSame(400, $this->upload("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n", 'application/pdf', 'doc.pdf')['status']);
    }

    public function testUneEnteteDImageSuiviDAutreChoseEstRefusee(): void
    {
        // Commence comme un PNG (signature) mais n'est pas une image décodable
        $response = $this->upload("\x89PNG\r\n\x1a\n" . '<?php system($_GET["c"]); ?>');

        $this->assertSame(400, $response['status'], $response['raw']);
    }

    public function testUnFichierDePlusDe5MoEstRefuse(): void
    {
        $response = $this->upload(self::pngBytes() . str_repeat('0', 5 * 1024 * 1024 + 1));

        $this->assertSame(400, $response['status']);
    }

    public function testSansFichierLaReponseEst400(): void
    {
        $response = self::$admin->request('POST', '/admin/upload', null, ['autre' => 'valeur']);

        $this->assertSame(400, $response['status']);
        $this->assertStringContainsString('Aucun fichier', $response['body']['message']);
    }

    public function testUnEnvoiAuFormatJsonEstRefuse(): void
    {
        // Le contrôle du type de contenu (index.php) refuse le JSON sur cette route avant même le contrôleur
        $response = self::$admin->post('/admin/upload', ['image' => 'x']);

        $this->assertSame(415, $response['status']);
    }

    public function testLeDossierDesImagesInterditLExecutionDeScripts(): void
    {
        $this->keep($this->upload(self::pngBytes()));

        $htaccess = __DIR__ . '/../public/uploads/products/.htaccess';
        $this->assertFileExists($htaccess);
        $this->assertStringContainsString('Require all denied', (string) file_get_contents($htaccess));
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
}
