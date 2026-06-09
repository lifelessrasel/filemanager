mkdir -p {!! escapeshellarg($directory) !!}
printf '%s' {!! escapeshellarg($encoded) !!} | base64 -d > {!! escapeshellarg($path) !!}
