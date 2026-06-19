<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si le navigateur envoie une requête de pré-vérification (OPTIONS), on valide immédiatement
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
