<?php

namespace App\Core;

/** Le serveur ne sait pas traiter les images (extension GD absente) : l'envoi est refusé plutôt que de stocker le fichier brut. */
final class UploadUnavailableException extends \RuntimeException
{
}
