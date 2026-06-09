<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Support;

use App\Actions\Ziggy\GetZiggyRoutes;
use Illuminate\Support\Facades\File;

final class InstallPluginAssets
{
    private const string MARKER_START = '{/* vitodeploy-filemanager-plugin:start */}';

    private const string MARKER_END = '{/* vitodeploy-filemanager-plugin:end */}';

    public function install(string $pluginRoot): void
    {
        $this->publishFrontend($pluginRoot);
        $this->patchServerLayout($pluginRoot);
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

    private function publishFrontend(string $pluginRoot): void
    {
        $source = $pluginRoot.'/resources/js/pages/filemanager';
        $target = resource_path('js/pages/filemanager');

        if (! File::isDirectory($source)) {
            return;
        }

        if (File::isDirectory($target)) {
            File::deleteDirectory($target);
        }

        File::copyDirectory($source, $target);
    }

    private function patchServerLayout(string $pluginRoot): void
    {
        $layoutPath = resource_path('js/layouts/server/layout.tsx');
        $patchPath = $pluginRoot.'/resources/patches/server-layout-nav.tsx.patch';

        if (! File::exists($layoutPath) || ! File::exists($patchPath)) {
            return;
        }

        $contents = File::get($layoutPath);
        if (str_contains($contents, self::MARKER_START)) {
            return;
        }

        if (! str_contains($contents, 'FolderIcon')) {
            $contents = str_replace(
                "  GlobeIcon,\n",
                "  FolderIcon,\n  GlobeIcon,\n",
                $contents
            );
        }

        $patch = trim(File::get($patchPath));
        $needle = "                icon: RocketIcon,\n              },\n              {\n                title: 'Domains',";

        if (! str_contains($contents, $needle)) {
            return;
        }

        File::put(
            $layoutPath,
            str_replace($needle, "                icon: RocketIcon,\n              },\n".$patch."\n              {\n                title: 'Domains',", $contents)
        );
    }

    private function unpatchServerLayout(): void
    {
        $layoutPath = resource_path('js/layouts/server/layout.tsx');
        if (! File::exists($layoutPath)) {
            return;
        }

        $contents = File::get($layoutPath);
        $pattern = '/\s*\/\* vitodeploy-filemanager-plugin:start \*\/.*?\/\* vitodeploy-filemanager-plugin:end \*\/\s*/s';
        $contents = preg_replace($pattern, "\n", $contents) ?? $contents;
        $contents = str_replace("  FolderIcon,\n  GlobeIcon,\n", "  GlobeIcon,\n", $contents);

        File::put($layoutPath, $contents);
    }
}
