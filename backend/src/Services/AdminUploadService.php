<?php

namespace App\Services;

class AdminUploadService
{
    private const MAX_SIZE  = 5 * 1024 * 1024;
    private const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp'];
    private const UPLOAD_DIR = __DIR__ . '/../../public/uploads/products/';

    /**
     * Valide et déplace un fichier uploadé.
     * Retourne l'URL publique relative.
     *
     * @throws \InvalidArgumentException si le fichier est invalide
     * @throws \RuntimeException         si l'écriture échoue
     */
    public function store(array $file): string
    {
        $this->validateSize($file);
        $mimeType = $this->validateMime($file);
        return $this->move($file, $mimeType);
    }

    private function validateSize(array $file): void
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException(
                'Erreur lors de la réception du fichier (code ' . $file['error'] . ').'
            );
        }

        if ($file['size'] > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Le fichier dépasse 5 Mo.');
        }
    }

    private function validateMime(array $file): string
    {
        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, self::ALLOWED, true)) {
            throw new \InvalidArgumentException(
                'Format non autorisé. Utilisez JPG, PNG ou WebP.'
            );
        }

        return $mimeType;
    }

    private function move(array $file, string $mimeType): string
    {
        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        };

        $filename = 'product_' . bin2hex(random_bytes(16)) . '.' . $extension;

        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], self::UPLOAD_DIR . $filename)) {
            throw new \RuntimeException('Erreur lors de la sauvegarde du fichier.');
        }

        return 'uploads/products/' . $filename;
    }
}
