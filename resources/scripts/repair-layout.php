<?php

$path = dirname(__DIR__, 3).'/resources/js/layouts/server/layout.tsx';

if (! is_file($path)) {
    $path = '/var/www/html/resources/js/layouts/server/layout.tsx';
}

if (! is_file($path)) {
    fwrite(STDERR, "Could not find resources/js/layouts/server/layout.tsx\n");
    exit(1);
}

$patch = trim((string) file_get_contents(dirname(__DIR__).'/patches/server-layout-nav.tsx.patch'));
$contents = (string) file_get_contents($path);

$pattern = '/(                icon: RocketIcon,\n              \},)\s*'
    .'(?:\{\/\* vitodeploy-filemanager-plugin:(?:start|end) \*\/\}\s*\n|'
    .'\/\/ vitodeploy-filemanager-plugin:(?:start|end\)\s*\n|'
    .'\{\s*\n\s*title: [\'"]File Manager[\'"].*?\n\s*\},\s*)*'
    .'\s*(\{\s*\n\s*title: [\'"]Domains[\'"],)/s';

if (! preg_match($pattern, $contents, $matches)) {
    fwrite(STDERR, "Could not locate Application/Domains section to repair.\n");
    exit(1);
}

$contents = str_replace(
    $matches[0],
    $matches[1]."\n".$patch."\n              ".$matches[2],
    $contents
);

if (! str_contains($contents, 'FolderIcon')) {
    $contents = str_replace("  GlobeIcon,\n", "  FolderIcon,\n  GlobeIcon,\n", $contents);
}

file_put_contents($path, $contents);

echo "Layout repaired.\n";
