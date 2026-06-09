@php
    $basename = basename($path);
@endphp

@if(str_ends_with(strtolower($basename), '.zip'))
unzip -o {!! $quotedPath !!} -d {!! $quotedDestination !!}
@elseif(str_ends_with(strtolower($basename), '.tar.gz') || str_ends_with(strtolower($basename), '.tgz'))
tar -xzf {!! $quotedPath !!} -C {!! $quotedDestination !!}
@elseif(str_ends_with(strtolower($basename), '.tar.bz2'))
tar -xjf {!! $quotedPath !!} -C {!! $quotedDestination !!}
@elseif(str_ends_with(strtolower($basename), '.tar'))
tar -xf {!! $quotedPath !!} -C {!! $quotedDestination !!}
@elseif(str_ends_with(strtolower($basename), '.gz') && ! str_contains(strtolower($basename), '.tar.'))
gzip -dc {!! $quotedPath !!} > {!! $quotedDestination !!}/{{ basename($path, '.gz') }}
@else
echo "VITO_SSH_ERROR: Unsupported archive format" && exit 1
@endif
