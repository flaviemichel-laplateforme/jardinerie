<?php
// -----------------------------------------------------------------------
// 1. L'AUTOLOADER COMPOSER
// Charge automatiquement toutes les librairies (AltoRouter, Dotenv) 
// et vos futures classes (src/Models, src/Controllers) via la norme PSR-4.
// -----------------------------------------------------------------------
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
// 5. MATCHING & DISPATCHING (Exécution)
// -----------------------------------------------------------------------
// On demande à AltoRouter si l'URL tapée par le client correspond à une route définie au-dessus.
$match = $router->match();

if (is_array($match) && is_callable($match['target'])) {

    // Si la route existe, on exécute la fonction associée en lui passant les paramètres éventuels de l'URL
    call_user_func_array($match['target'], $match['params']);
} else {

    // Si la route n'existe pas : Gestion propre de l'erreur 404 au format JSON
    header($_SERVER["SERVER_PROTOCOL"] . ' 404 Not Found');
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'status' => 404,
        'error' => 'Point de terminaison introuvable (Not Found).'
    ]);
}
