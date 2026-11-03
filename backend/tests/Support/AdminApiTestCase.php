<?php

namespace Tests\Support;

use App\Core\Database;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * Base des tests de l'API admin (tests d'intégration : requêtes HTTP réelles vers l'API locale, base locale).
 *
 * Chaque classe de test crée ses propres comptes (un administrateur, un client) et ses données, tous préfixés « zz-tadm- », puis
 * supprime tout à la fin : la base locale n'accumule rien. Prérequis : l'API locale tourne (conteneur « api », comme pour
 * AuthControllerIntegrationTest) et RATE_LIMIT_DISABLED=true dans backend/.env (sinon les connexions répétées seraient limitées).
 */
abstract class AdminApiTestCase extends TestCase
{
    protected const PASSWORD = 'Rz7!vTq92#mK';

    protected static PDO $db;
    protected static string $prefix;

    /** @var array{id:int, email:string} */
    protected static array $adminUser;
    /** @var array{id:int, email:string} */
    protected static array $customerUser;

    protected static ApiClient $admin;
    protected static ApiClient $customer;
    protected static ApiClient $visitor;

    /** @var int[] */
    private static array $userIds = [];
    /** @var int[] */
    private static array $productIds = [];
    /** @var string[] fichiers déposés par les tests (chemins relatifs à public/) */
    private static array $files = [];

    public static function setUpBeforeClass(): void
    {
        self::$db = Database::getConnection();
        self::$prefix = 'zz-tadm-' . bin2hex(random_bytes(3));
        self::$userIds = self::$productIds = self::$files = [];

        self::$adminUser    = self::createUser('admin');
        self::$customerUser = self::createUser('customer');

        self::$visitor  = new ApiClient();
        self::$admin    = new ApiClient();
        self::$customer = new ApiClient();

        self::assertSame(200, self::$admin->login(self::$adminUser['email'], self::PASSWORD), "connexion de l'administrateur de test");
        self::assertSame(200, self::$customer->login(self::$customerUser['email'], self::PASSWORD), 'connexion du client de test');
    }

    public static function tearDownAfterClass(): void
    {
        $db = self::$db;

        if (self::$userIds) {
            $in = implode(',', array_map('intval', self::$userIds));
            $db->exec("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN ($in))");
            $db->exec("DELETE FROM orders WHERE user_id IN ($in)");
            $db->exec("DELETE FROM addresses WHERE user_id IN ($in)");
            $db->exec("DELETE FROM account_tokens WHERE user_id IN ($in)");
            $db->exec("DELETE FROM security_events WHERE user_id IN ($in)");
            $db->exec("DELETE FROM users WHERE id IN ($in)");
        }

        // Produits créés par les tests (directement ou par l'API) : repérés par leur référence (sku)
        $ids = $db->query("SELECT id FROM products WHERE sku LIKE '" . self::$prefix . "%'")->fetchAll(PDO::FETCH_COLUMN);
        $ids = array_unique(array_merge($ids, self::$productIds));
        if ($ids) {
            $in = implode(',', array_map('intval', $ids));
            $db->exec("DELETE FROM order_items WHERE product_id IN ($in)");
            $db->exec("DELETE FROM plant_criterion WHERE plant_id IN (SELECT id FROM plants WHERE product_id IN ($in))");
            $db->exec("DELETE FROM plants WHERE product_id IN ($in)");
            $db->exec("DELETE FROM products WHERE id IN ($in)");
        }

        foreach (self::$files as $relative) {
            $path = __DIR__ . '/../../public/' . $relative;
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    // ------------------------------------------------------------------ données de test

    /** @return array{id:int, email:string} */
    protected static function createUser(string $role = 'customer', string $firstName = 'Zz'): array
    {
        $email = self::$prefix . '-' . bin2hex(random_bytes(3)) . '@example.invalid';

        self::$db->prepare("INSERT INTO users (first_name,last_name,email,password,role,email_verified_at) VALUES (?, 'Tadm', ?, ?, ?, NOW())")
            ->execute([$firstName, $email, password_hash(self::PASSWORD, PASSWORD_BCRYPT, ['cost' => 10]), $role]);

        $id = (int) self::$db->lastInsertId();
        self::$userIds[] = $id;

        return ['id' => $id, 'email' => $email];
    }

    /** Copie d'un produit existant (catégorie, TVA…) avec les valeurs voulues ; renvoie son identifiant. */
    protected static function createProduct(array $overrides = []): int
    {
        $row = self::$db->query('SELECT * FROM products WHERE is_active = 1 ORDER BY id LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        unset($row['id']);

        $row = array_merge($row, [
            'name'           => 'ZZ test produit',
            'price_tax_incl' => '10.00',
            'stock_quantity' => 10,
            'is_active'      => 1,
            'sku'            => strtoupper(self::$prefix . '-' . bin2hex(random_bytes(3))),
        ], $overrides);

        $cols = array_keys($row);
        self::$db->prepare('INSERT INTO products (`' . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')
            ->execute(array_values($row));

        $id = (int) self::$db->lastInsertId();
        self::$productIds[] = $id;

        return $id;
    }

    /** Commande avec un article (2 × 10,00 €) ; renvoie son identifiant. */
    protected static function createOrder(int $userId, int $productId, string $status = 'paid', string $total = '20.00', string $shipping = '4.90', ?string $date = null): int
    {
        $payment   = (int) self::$db->query('SELECT id FROM payment_methods ORDER BY id LIMIT 1')->fetchColumn();
        $delivery  = (int) self::$db->query('SELECT id FROM delivery_methods ORDER BY id LIMIT 1')->fetchColumn();
        $reference = 'ZZ-TADM-' . strtoupper(bin2hex(random_bytes(5)));

        self::$db->prepare('INSERT INTO orders (user_id,payment_method_id,delivery_method_id,billing_address_text,shipping_address_text,order_reference,order_date,total_amount_tax_incl,shipping_cost_tax_incl,status)
                            VALUES (?,?,?,?,?,?,COALESCE(?, NOW()),?,?,?)')
            ->execute([$userId, $payment, $delivery, 'Facturation de test', 'Livraison de test', $reference, $date, $total, $shipping, $status]);
        $orderId = (int) self::$db->lastInsertId();

        self::$db->prepare('INSERT INTO order_items (order_id,product_id,quantity,unit_price_tax_incl) VALUES (?,?,?,?)')->execute([$orderId, $productId, 2, '10.00']);

        return $orderId;
    }

    /** Produit créé par l'API sans référence (sku vide) : le nettoyage par préfixe de référence ne le trouverait pas. */
    protected static function trackProduct(int $id): void
    {
        self::$productIds[] = $id;
    }

    /** À appeler pour tout fichier déposé par l'API pendant un test : il sera supprimé en fin de classe. */
    protected static function trackFile(string $relativePath): void
    {
        self::$files[] = $relativePath;
    }

    /** Image PNG valide de la taille voulue. */
    protected static function pngBytes(int $width = 200, int $height = 200): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 40, 140, 80));
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }
}
