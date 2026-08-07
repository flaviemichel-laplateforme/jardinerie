<?php

namespace App\Core;

use PDO;
use PDOException;
use Exception;

class Database
{

    private static ?PDO $instance = null;

    // Empêche l'instanciation de la classe avec "new Database()"
    private function __construct() {}

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            try {
                $host = $_ENV['DB_HOST'];
                $port = $_ENV['DB_PORT'];
                $dbName = $_ENV['DB_NAME'];
                $user = $_ENV['DB_USER'];

                $passwordFile = '/run/secrets/db_password';
                if (!file_exists($passwordFile)) {
                    throw new Exception("Erreur critique ! Secret Docker introuvable.");
                }
                $password = trim(file_get_contents($passwordFile));

                $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lève des vraies erreurs PHP
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Renvoie des tableaux associatifs
                    PDO::ATTR_EMULATE_PREPARES   => false,                  // Sécurité maximale contre les injections SQL
                ];

                self::$instance = new PDO($dsn, $user, $password, $options);
            } catch (PDOException $e) {
                throw new Exception("Erreur de connexion à la base de données : " . $e->getMessage());
            }
        }
        return self::$instance;
    }
}
