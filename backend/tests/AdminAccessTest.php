<?php

namespace Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;
use Tests\Support\ApiClient;

/**
 * Qui a le droit d'appeler l'API admin ? Vérifié sur TOUTES les routes, par de vraies requêtes HTTP.
 * Aucune de ces requêtes ne modifie de données : les routes d'écriture sont refusées avant d'agir (visiteur, client), et un administrateur
 * n'est testé que sur les routes de lecture.
 */
#[Group('integration')]
class AdminAccessTest extends AdminApiTestCase
{
    private const FORBIDDEN_MESSAGE = 'Accès refusé . Droits administrateur requis.';

    /** @return array<string, array{0:string, 1:string}> méthode, chemin */
    public static function adminRoutes(): array
    {
        return [
            'liste des produits'        => ['GET', '/admin/products'],
            'détail d\'un produit'      => ['GET', '/admin/products/1'],
            'création de produit'       => ['POST', '/admin/products'],
            'modification de produit'   => ['PATCH', '/admin/products/1'],
            'désactivation de produit'  => ['DELETE', '/admin/products/1'],
            'arbre des catégories'      => ['GET', '/admin/categories'],
            'taux de TVA'               => ['GET', '/admin/taxes'],
            'création de catégorie'     => ['POST', '/admin/categories'],
            'création de sous-catégorie' => ['POST', '/admin/subcategories'],
            'modification de rayon'     => ['PATCH', '/admin/departments/1'],
            'renommage de catégorie'    => ['PATCH', '/admin/categories/1'],
            'suppression de catégorie'  => ['DELETE', '/admin/categories/1'],
            'renommage de sous-catégorie' => ['PATCH', '/admin/subcategories/1'],
            'suppression de sous-catégorie' => ['DELETE', '/admin/subcategories/1'],
            'listes des sols'           => ['GET', '/admin/soils'],
            'ajout de nature de sol'    => ['POST', '/admin/soil-types'],
            'renommage de nature de sol' => ['PATCH', '/admin/soil-types/1'],
            'suppression de nature de sol' => ['DELETE', '/admin/soil-types/1'],
            'ajout de pH de sol'        => ['POST', '/admin/soil-ph'],
            'renommage de pH de sol'    => ['PATCH', '/admin/soil-ph/1'],
            'suppression de pH de sol'  => ['DELETE', '/admin/soil-ph/1'],
            'envoi d\'image'            => ['POST', '/admin/upload'],
            'ventes (KPI)'              => ['GET', '/admin/kpis/sales'],
            'alertes de stock'          => ['GET', '/admin/stock/alerts'],
            'historique du stock'       => ['GET', '/admin/stock/movements'],
            'ajustement du stock'       => ['POST', '/admin/products/1/stock'],
            'liste des commandes'       => ['GET', '/admin/orders'],
            'détail d\'une commande'    => ['GET', '/admin/orders/1'],
            'statut d\'une commande'    => ['PATCH', '/admin/orders/1/status'],
            'journal de sécurité'       => ['GET', '/admin/security-events'],
            'liste des clients'         => ['GET', '/admin/clients'],
            'détail d\'un client'       => ['GET', '/admin/clients/1'],
            'rôle d\'un client'         => ['PATCH', '/admin/clients/1/role'],
            'anonymisation d\'un client' => ['POST', '/admin/clients/1/anonymize'],
            'lien de réinitialisation'  => ['POST', '/admin/clients/1/password-reset'],
        ];
    }

    /** @return array<string, array{0:string, 1:string}> */
    public static function readOnlyAdminRoutes(): array
    {
        return array_filter(self::adminRoutes(), fn(array $route) => $route[0] === 'GET' && $route[1] !== '/admin/products/1' && $route[1] !== '/admin/orders/1' && $route[1] !== '/admin/clients/1');
    }

    #[DataProvider('adminRoutes')]
    public function testUnVisiteurSansSessionEstRefuse(string $method, string $path): void
    {
        $response = self::$visitor->request($method, $path);

        $this->assertSame(401, $response['status'], "$method $path");
        $this->assertFalse($response['body']['success']);
    }

    #[DataProvider('adminRoutes')]
    public function testUnClientConnecteEstRefuseAvecLeBonMessage(string $method, string $path): void
    {
        $response = self::$customer->request($method, $path);

        $this->assertSame(403, $response['status'], "$method $path");
        $this->assertSame(self::FORBIDDEN_MESSAGE, $response['body']['message']);
    }

    #[DataProvider('readOnlyAdminRoutes')]
    public function testUnAdministrateurPeutLireLesRoutesDeLecture(string $method, string $path): void
    {
        $response = self::$admin->request($method, $path);

        $this->assertSame(200, $response['status'], "$method $path : " . $response['raw']);
        $this->assertTrue($response['body']['success']);
    }

    public function testUnCookieDeSessionInventeEstRefuseEtEfface(): void
    {
        $forged = new ApiClient();
        $forged->cookie = 'ceci.nest.pas.un.jeton';

        $response = $forged->get('/admin/products');

        $this->assertSame(401, $response['status']);
        $this->assertSame('Session invalide ou expirée.', $response['body']['message']);
        $this->assertNull($forged->cookie, 'le cookie refusé est effacé côté navigateur');
    }

    public function testUnJetonSigneParUneAutreCleEstRefuse(): void
    {
        // Même forme qu'un vrai jeton, mais signé avec une clé quelconque : la signature ne correspond pas
        $header  = rtrim(strtr(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $payload = rtrim(strtr(base64_encode(json_encode(['id' => self::$adminUser['id'], 'role' => 'admin', 'iss' => 'x', 'iat' => time(), 'exp' => time() + 3600, 'tv' => 0])), '+/', '-_'), '=');
        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$payload", 'une-autre-cle-secrete-0123456789abcdef', true)), '+/', '-_'), '=');

        $forged = new ApiClient();
        $forged->cookie = "$header.$payload.$signature";

        $this->assertSame(401, $forged->get('/admin/products')['status']);
    }

    public function testLeRoleEstRelueEnBaseEtNonDansLeJeton(): void
    {
        // Un client connecté (jeton « customer ») promu directement en base : la route le reconnaît aussitôt, sans nouvelle connexion
        $user = self::createUser('customer');
        $client = new ApiClient();
        $client->login($user['email'], self::PASSWORD);

        $this->assertSame(403, $client->get('/admin/products')['status']);

        self::$db->prepare("UPDATE users SET role = 'admin' WHERE id = ?")->execute([$user['id']]);

        $this->assertSame(200, $client->get('/admin/products')['status']);
    }

    public function testUnAdministrateurRetrogradeParUnAutrePerdSesDroitsImmediatement(): void
    {
        $other = self::createUser('admin');
        $session = new ApiClient();
        $this->assertSame(200, $session->login($other['email'], self::PASSWORD));
        $this->assertSame(200, $session->get('/admin/products')['status'], 'avant la rétrogradation');

        $change = self::$admin->patch("/admin/clients/{$other['id']}/role", ['role' => 'customer']);
        $this->assertSame(200, $change['status'], $change['raw']);

        // Le changement de rôle ferme aussi ses sessions (version de session incrémentée) : 401, pas seulement 403
        $this->assertSame(401, $session->get('/admin/products')['status']);
    }
}
