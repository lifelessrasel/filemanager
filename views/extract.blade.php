@php
    $basename = basename($path);
@endphp

@if(str_ends_with(strtolower($basename), '.zip'))
unzip -o {{ $path }} -d {{ $destination }}
@elseif(str_ends_with(strtolower($basename), '.tar.gz') || str_ends_with(strtolower($basename), '.tgz'))
tar -xzf {{ $path }} -C {{ $destination }}
@elseif(str_ends_with(strtolower($basename), '.tar.bz2'))
tar -xjf {{ $path }} -C {{ $destination }}
@elseif(str_ends_with(strtolower($basename), '.tar'))
tar -xf {{ $path }} -C {{ $destination }}
@else
echo "Unsupported archive format"
@endif
