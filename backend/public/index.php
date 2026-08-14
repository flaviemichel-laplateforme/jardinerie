<?php

// CONFIGURATION CORS (Support des Cookies)

$allowedOrigins = [
    'http://localhost:5173', // Front-end React en développement
    'https://jardinerie.vercel.app' // Front-end en production (Vercel)
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Si l'origine de la requête fait partie de nos origines autorisées, on l'affiche explicitement
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Fallback de sécurité
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Credentials: true"); // INDISPENSABLE pour les cookies HttpOnly
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si le navigateur envoie une requête de pré-vérification (OPTIONS), on valide immédiatement
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Toutes les réponses de l'API sont en JSON — posé une seule fois ici
// plutôt que répété dans chaque contrôleur.
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../vendor/autoload.php';


// -----------------------------------------------------------------------
// 2. CONFIGURATION DE L'ENVIRONNEMENT
// On charge les variables sécurisées depuis le fichier .env
// -----------------------------------------------------------------------
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
} catch (Exception $e) {
    // Si le fichier .env manque, on stoppe tout immédiatement pour des raisons de sécurité
    header($_SERVER["SERVER_PROTOCOL"] . ' 500 Internal Server Error');
    die(json_encode(['error' => 'Erreur critique : Fichier de configuration introuvable.']));
}


// -----------------------------------------------------------------------
// 3. INITIALISATION DU ROUTEUR (AltoRouter)
// -----------------------------------------------------------------------
$router = new AltoRouter();

// Optionnel mais recommandé : Si votre projet était dans un sous-dossier (ex: localhost/monprojet/api)
// il faudrait indiquer la base de l'URL ici. Avec Docker, on est à la racine, donc on laisse vide ou on gère dynamiquement.
// $router->setBasePath(''); 


// -----------------------------------------------------------------------
// 4. MAPPING (Définition des routes de l'API)
// -----------------------------------------------------------------------
// Méthode map( 'VERBE_HTTP', 'ROUTE', 'FONCTION_CIBLE', 'NOM_DE_LA_ROUTE' )

$router->map('GET', '/api/test', function () {

    // En tant qu'API professionnelle, on force le format de réponse en JSON
    header('Content-Type: application/json; charset=utf-8');

    // On renvoie un tableau PHP qui sera converti en texte JSON
    echo json_encode([
        'status' => 200,
        'message' => 'Félicitations, le routage AltoRouter fonctionne à merveille !',
        'data' => [
            'app_env' => $_ENV['APP_ENV'] ?? 'non-défini',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);
}, 'api_test_route');

// -----------------------------------------------------------------------
// Route de test pour la Base de Données (Issue #4)
// -----------------------------------------------------------------------
$router->map('GET', '/api/test-db', function () {
    header('Content-Type: application/json; charset=utf-8');

    try {
        // On instancie la connexion PDO via votre Singleton
        $db = \App\Core\Database::getConnection();

        // On effectue une requête très simple pour vérifier la lecture
        $stmt = $db->query("SELECT id, name FROM departments LIMIT 2");
        $departments = $stmt->fetchAll();

        echo json_encode([
            'status' => 200,
            'message' => 'Connexion MySQL réussie avec succès !',
            'data' => $departments
        ], JSON_UNESCAPED_UNICODE);
    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 500,
            'error' => 'Erreur de base de données : ' . $e->getMessage(),

        ], JSON_UNESCAPED_UNICODE);
    }
}, 'api_test_db_route');

$router->map('GET', '/api/departments', 'DepartmentController#index', 'api_departments_list');

$router->map('GET', '/api/products', 'ProductController#index', 'api_products_list');
$router->map('GET', '/api/products/[i:id]', 'ProductController#show', 'api_product_show');
$router->map('GET', '/api/products/[i:id]/availability', 'ProductController#checkAvailability', 'api_product_availability');

$router->map('GET', '/api/filters', 'FilterController#index', 'api_filters_list');

$router->map('POST', '/api/auth/register', 'AuthController#register', 'api_auth_register');
$router->map('POST', '/api/auth/login', 'AuthController#login', 'api_auth_login');
$router->map('GET', '/api/auth/me', 'AuthController#me', 'api_auth_me');
$router->map('POST', '/api/auth/logout', 'AuthController#logout', 'api_auth_logout');
$router->map('POST', '/api/auth/request-password-reset', 'AuthController#requestPasswordReset', 'api_auth_request_password_reset');
$router->map('POST', '/api/auth/reset-password', 'AuthController#resetPassword', 'api_auth_reset_password');
$router->map('GET', '/api/auth/verify-email', 'AuthController#verifyEmail', 'api_auth_verify_email');



$router->map('GET', '/api/addresses', 'AddressController#index', 'api_addresses_list');
$router->map('POST', '/api/addresses', 'AddressController#store', 'api_addresses_create');
$router->map('PUT', '/api/addresses/[i:id]', 'AddressController#update', 'api_addresses_update');
$router->map('DELETE', '/api/addresses/[i:id]', 'AddressController#destroy', 'api_addresses_delete');

$router->map('GET', '/api/me/orders/[i:id]', 'OrderController#show', 'api_me_orders_show');
$router->map('GET', '/api/me/orders', 'OrderController#index', 'api_me_orders_list');

$router->map('GET', '/api/me', 'UserController#show', 'api_me_show');
$router->map('GET', '/api/me/dashboard', 'UserController#dashboard', 'api_me_dashboard');
$router->map('PUT', '/api/me/profile', 'UserController#update', 'api_me_update');
$router->map('PUT', '/api/me/password', 'UserController#updatePassword', 'api_me_password');
$router->map('DELETE', '/api/me', 'UserController#delete', 'api_me_delete');


// -----------------------------------------------------------------------
// ROUTES ADMIN — PRODUITS
// -----------------------------------------------------------------------
$router->map('GET',    '/api/admin/products',        'AdminProductController#index',   'admin_products_list');
$router->map('GET',    '/api/admin/products/[i:id]', 'AdminProductController#show',    'admin_products_show');
$router->map('POST',   '/api/admin/products',        'AdminProductController#store',   'admin_products_store');
$router->map('PATCH',  '/api/admin/products/[i:id]', 'AdminProductController#update',  'admin_products_update');
$router->map('DELETE', '/api/admin/products/[i:id]', 'AdminProductController#destroy', 'admin_products_delete');

// ADMIN — CATÉGORIES & TAXES
$router->map('GET',  '/api/admin/categories',   'AdminCategoryController#tree',             'admin_cat_tree');
$router->map('GET',  '/api/admin/taxes',         'AdminCategoryController#taxes',            'admin_taxes');
$router->map('POST', '/api/admin/categories',    'AdminCategoryController#createCategory',   'admin_cat_create');
$router->map('POST', '/api/admin/subcategories', 'AdminCategoryController#createSubcategory', 'admin_subcat_create');

// ADMIN -- UPLOAD
$router->map('POST', '/api/admin/upload', 'AdminUploadController#store', 'admin_upload');

//ADMIN DASHBOARD
$router->map('GET', '/api/admin/kpis/sales', 'AdminKpiController#sales', 'admin_kpis');
// Route pour les alertes de stock admin
$router->map('GET', '/api/admin/stock/alerts', 'AdminStockController#getAlerts', 'admin_stock_alerts');
// ADMIN — GESTION DES COMMANDES (Issue #42)
$router->map('GET', '/api/admin/orders', 'AdminOrderController#index', 'admin_orders_list');
$router->map('GET', '/api/admin/orders/[i:id]', 'AdminOrderController#show', 'admin_orders_show');
$router->map('PATCH', '/api/admin/orders/[i:id]/status', 'AdminOrderController#updateStatus', 'admin_orders_update_status');

// ADMIN — GESTION DES CLIENTS
$router->map('GET',   '/api/admin/clients',                        'AdminClientController#index',            'admin_clients_list');
$router->map('GET',   '/api/admin/clients/[i:id]',                 'AdminClientController#show',              'admin_clients_show');
$router->map('PATCH', '/api/admin/clients/[i:id]/role',             'AdminClientController#updateRole',        'admin_clients_update_role');
$router->map('POST',  '/api/admin/clients/[i:id]/anonymize',        'AdminClientController#anonymize',         'admin_clients_anonymize');
$router->map('POST',  '/api/admin/clients/[i:id]/password-reset',   'AdminClientController#sendPasswordReset', 'admin_clients_password_reset');



$router->map('GET', '/api/admin/test', function () {
    $payload = \App\Middlewares\AdminMiddleware::authenticate();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'role' => $payload['role']]);
}, 'admin_test');


// -----------------------------------------------------------------------
// ROUTES DE PAIEMENT (Stripe)
// -----------------------------------------------------------------------
// 1. Création de l'intention de paiement (Appelé par React lors du clic sur "Payer")
$router->map('POST', '/api/checkout/payment-intent', 'CheckoutController#createIntent', 'api_checkout_intent');
// 2. Webhook Stripe (Appelé par les serveurs de Stripe en arrière-plan)
$router->map('POST', '/api/webhooks/stripe', 'CheckoutController#handleWebhook', 'api_stripe_webhook');




// -----------------------------------------------------------------------
// 5. MATCHING & DISPATCHING (Exécution)
// -----------------------------------------------------------------------
// On demande à AltoRouter si l'URL tapée par le client correspond à une route définie au-dessus.
$match = $router->match();
$dispatched = false;

if (is_array($match)) {

    $target = $match['target'];

    if (is_callable($target)) {
        // Si la route existe et pointe vers une closure, on l'exécute directement.
        call_user_func_array($target, $match['params']);
        $dispatched = true;
    }

    // Support des cibles de type "Controller#method" (ex: DepartmentController#index)
    if (!$dispatched && is_string($target) && strpos($target, '#') !== false) {
        [$controllerName, $method] = explode('#', $target, 2);
        $controllerClass = 'App\\Controllers\\' . $controllerName;

        if (class_exists($controllerClass) && method_exists($controllerClass, $method)) {
            $controller = new $controllerClass();
            call_user_func_array([$controller, $method], $match['params']);
            $dispatched = true;
        }
    }
}

if (!$dispatched) {

    // Si la route n'existe pas : Gestion propre de l'erreur 404 au format JSON
    header($_SERVER["SERVER_PROTOCOL"] . ' 404 Not Found');
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'status' => 404,
        'error' => 'Point de terminaison introuvable (Not Found).'
    ]);
}
