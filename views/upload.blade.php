@if(! $append)
mkdir -p {!! escapeshellarg($directory) !!}
printf '%s' {!! escapeshellarg($encoded) !!} | base64 -d > {!! escapeshellarg($path) !!}
@else
printf '%s' {!! escapeshellarg($encoded) !!} | base64 -d >> {!! escapeshellarg($path) !!}
@endif
