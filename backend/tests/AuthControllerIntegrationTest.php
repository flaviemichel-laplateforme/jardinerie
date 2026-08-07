<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

class AuthControllerIntegrationTest extends TestCase
{
    public function testInscriptionReussie(): void
    {
        $emailUnique = "test_" . time() . "@example.com";

        $donnees = [
            'first_name' => 'Test',
            'last_name'  => 'Integration',
            'email'      => $emailUnique,
            'password'   => 'MotDePasse123*',
            'gdpr_consent' => true,
        ];

        $options = [
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/json\r\n",
                'content'       => json_encode($donnees),
                'ignore_errors' => true, // récupère la réponse même si le code HTTP est une erreur
            ],
        ];

        $contexte = stream_context_create($options);
        $reponseBrute = file_get_contents('http://localhost/api/auth/register', false, $contexte);
        $reponse = json_decode($reponseBrute, true);


        $this->assertTrue($reponse['success']); // À toi de vérifier ici que $reponse['success'] est bien true
    }
}
