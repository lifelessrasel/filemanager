dd if={!! escapeshellarg($path) !!} bs={{ $chunkSize }} skip={{ $skip }} count=1 2>/dev/null | base64 | tr -d '\n'
