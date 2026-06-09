<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Support;

use App\Actions\Ziggy\GetZiggyRoutes;
use Illuminate\Support\Facades\File;
use RuntimeException;

final class InstallPluginAssets
{
    private const string MARKER_START = '// vitodeploy-filemanager-plugin:start';

    private const string MARKER_END = '// vitodeploy-filemanager-plugin:end';

    private const string LEGACY_MARKER_START = '{/* vitodeploy-filemanager-plugin:start */}';

    private const string LEGACY_MARKER_END = '{/* vitodeploy-filemanager-plugin:end */}';

    public function install(string $pluginRoot, bool $forceLayout = false): void
    {
        $this->publishFrontend($pluginRoot);
        $this->patchServerLayout($pluginRoot, $forceLayout);
        GetZiggyRoutes::forgetCache();
    }

    public function uninstall(): void
    {
        $frontendPath = resource_path('js/pages/filemanager');
        if (File::isDirectory($frontendPath)) {
            File::deleteDirectory($frontendPath);
        }

        $this->unpatchServerLayout();
        GetZiggyRoutes::forgetCache();
    }

    public function isPublished(): bool
    {
        return File::exists(resource_path('js/pages/filemanager/index.tsx'));
    }

    public function isLayoutPatched(): bool
    {
        $layoutPath = resource_path('js/layouts/server/layout.tsx');

        if (! File::exists($layoutPath)) {
            return false;
        }

        return $this->isLayoutPatchValid(File::get($layoutPath));
    }

    private function publishFrontend(string $pluginRoot): void
    {
        $source = $pluginRoot.'/resources/js/pages/filemanager';
        $target = resource_path('js/pages/filemanager');

        if (! File::isDirectory($source)) {
            throw new RuntimeException('File Manager plugin frontend sources are missing.');
        }

        if (File::isDirectory($target)) {
            File::deleteDirectory($target);
        }

        File::copyDirectory($source, $target);

        if (! File::exists($target.'/index.tsx')) {
            throw new RuntimeException('File Manager plugin failed to publish frontend pages.');
        }
    }

    private function patchServerLayout(string $pluginRoot, bool $forceLayout = false): void
    {
        $layoutPath = resource_path('js/layouts/server/layout.tsx');
        $patchPath = $pluginRoot.'/resources/patches/server-layout-nav.tsx.patch';

        if (! File::exists($layoutPath)) {
            throw new RuntimeException('File Manager plugin could not find resources/js/layouts/server/layout.tsx.');
        }

        if (! File::exists($patchPath)) {
            throw new RuntimeException('File Manager plugin sidebar patch file is missing.');
        }

        $contents = File::get($layoutPath);

        if (! $forceLayout && $this->isLayoutPatchValid($contents)) {
            return;
        }

        $contents = $this->removeLayoutPatch($contents);
        $contents = $this->removeCorruptPatchFragments($contents);
        $contents = $this->ensureFolderIconImport($contents);
        $patch = trim(File::get($patchPath));

        $patched = $this->insertPatchBeforeDomains($contents, $patch);
        if ($patched !== null) {
            File::put($layoutPath, $patched);

            return;
        }

        $needles = [
            "                icon: RocketIcon,\n              },\n              {\n                title: 'Domains'," => "'Domains'",
            "                icon: RocketIcon,\n              },\n              {\n                title: \"Domains\"," => '"Domains"',
        ];

        foreach ($needles as $needle => $domainsQuote) {
            if (! str_contains($contents, $needle)) {
                continue;
            }

            File::put(
                $layoutPath,
                str_replace(
                    $needle,
                    "                icon: RocketIcon,\n              },\n".$patch."\n              {\n                title: {$domainsQuote},",
                    $contents
                )
            );

            return;
        }

        $pattern = '/(\{\s*\n\s*title:\s*[\'"]Application[\'"],\s*\n\s*href:\s*route\([\'"]application[\'"].*?\n\s*icon:\s*RocketIcon,\s*\n\s*\},)/s';

        if (preg_match($pattern, $contents, $matches)) {
            File::put($layoutPath, str_replace($matches[1], $matches[1]."\n".$patch, $contents));

            return;
        }

        throw new RuntimeException(
            'File Manager plugin could not patch the site sidebar. Re-enable the plugin after updating VitoDeploy, or add the nav item manually.'
        );
    }

    private function isLayoutPatchValid(string $contents): bool
    {
        if (! str_contains($contents, self::MARKER_START) || ! str_contains($contents, self::MARKER_END)) {
            return false;
        }

        if (! str_contains($contents, "title: 'File Manager'")) {
            return false;
        }

        if (str_contains($contents, self::LEGACY_MARKER_START) || str_contains($contents, self::LEGACY_MARKER_END)) {
            return false;
        }

        if (preg_match('/\{\s*\/\/\s*vitodeploy-filemanager-plugin:/', $contents)) {
            return false;
        }

        if (preg_match('/\{\s*\/\*\s*vitodeploy-filemanager-plugin:/', $contents)) {
            return false;
        }

        return true;
    }

    private function ensureFolderIconImport(string $contents): string
    {
        if (str_contains($contents, 'FolderIcon')) {
            return $contents;
        }

        if (str_contains($contents, "  FlameIcon,\n  GlobeIcon,\n")) {
            return str_replace("  FlameIcon,\n  GlobeIcon,\n", "  FlameIcon,\n  FolderIcon,\n  GlobeIcon,\n", $contents);
        }

        if (str_contains($contents, "  GlobeIcon,\n")) {
            return str_replace("  GlobeIcon,\n", "  FolderIcon,\n  GlobeIcon,\n", $contents);
        }

        throw new RuntimeException('File Manager plugin could not add FolderIcon to the server layout imports.');
    }

    private function unpatchServerLayout(): void
    {
        $layoutPath = resource_path('js/layouts/server/layout.tsx');
        if (! File::exists($layoutPath)) {
            return;
        }

        $contents = File::get($layoutPath);
        $contents = $this->removeLayoutPatch($contents);
        $contents = $this->removeCorruptPatchFragments($contents);
        $contents = str_replace("  FolderIcon,\n  GlobeIcon,\n", "  GlobeIcon,\n", $contents);
        $contents = str_replace("  FlameIcon,\n  FolderIcon,\n  GlobeIcon,\n", "  FlameIcon,\n  GlobeIcon,\n", $contents);

        File::put($layoutPath, $contents);
    }

    private function insertPatchBeforeDomains(string $contents, string $patch): ?string
    {
        $pattern = '/(                icon: RocketIcon,\n              \},)\s*'
            .'(?:\{\/\* vitodeploy-filemanager-plugin:(?:start|end) \*\/\}\s*\n|'
            .'\/\/ vitodeploy-filemanager-plugin:(?:start|end\)\s*\n|'
            .'\{\s*\n\s*title: [\'"]File Manager[\'"].*?\n\s*\},\s*)*'
            .'\s*(\{\s*\n\s*title: [\'"]Domains[\'"],)/s';

        if (! preg_match($pattern, $contents, $matches)) {
            return null;
        }

        return str_replace(
            $matches[0],
            $matches[1]."\n".$patch."\n              ".$matches[2],
            $contents
        );
    }

    private function removeLayoutPatch(string $contents): string
    {
        $patterns = [
            '/\s*\/\/ vitodeploy-filemanager-plugin:start\s*\n\s*\{\s*\n\s*title:\s*[\'"]File Manager[\'"].*?\n\s*\},\s*\n\s*\/\/ vitodeploy-filemanager-plugin:end\s*/s',
            '/\s*\/\* vitodeploy-filemanager-plugin:start \*\/\s*\n\s*\{\s*\n\s*title:\s*[\'"]File Manager[\'"].*?\n\s*\},\s*\n\s*\/\* vitodeploy-filemanager-plugin:end \*\/\s*/s',
        ];

        foreach ($patterns as $pattern) {
            $contents = preg_replace($pattern, "\n", $contents) ?? $contents;
        }

        return $contents;
    }

    private function removeCorruptPatchFragments(string $contents): string
    {
        $patterns = [
            '/\s*\{\/\* vitodeploy-filemanager-plugin:start \*\/\}\s*\n/s',
            '/\s*\{\/\* vitodeploy-filemanager-plugin:end \*\/\}\s*\n/s',
            '/\s*\{\/\/ vitodeploy-filemanager-plugin:start\s*\n/s',
            '/\s*\{\/\/ vitodeploy-filemanager-plugin:end\s*\n/s',
            '/\s*\/\/ vitodeploy-filemanager-plugin:start\s*\n/s',
            '/\s*\/\/ vitodeploy-filemanager-plugin:end\s*\n/s',
            '/\s*\{\s*\n\s*title:\s*[\'"]File Manager[\'"],\s*\n\s*href:\s*route\([\'"]site-filemanager[\'"].*?\n\s*\},\s*/s',
        ];

        foreach ($patterns as $pattern) {
            $contents = preg_replace($pattern, "\n", $contents) ?? $contents;
        }

        return $contents;
    }
}
