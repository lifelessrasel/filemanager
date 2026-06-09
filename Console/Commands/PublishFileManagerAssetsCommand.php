<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Console\Commands;

use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\InstallPluginAssets;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

class PublishFileManagerAssetsCommand extends Command
{
    protected $signature = 'filemanager:publish {--check : Only report status} {--force : Re-apply the sidebar layout patch}';

    protected $description = 'Publish File Manager frontend pages and patch the site sidebar';

    public function handle(InstallPluginAssets $assets): int
    {
        $pluginRoot = dirname(__DIR__, 2);

        if ($this->option('check')) {
            return $this->reportStatus($assets);
        }

        try {
            $assets->install($pluginRoot, (bool) $this->option('force'));
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('File Manager assets published.');
        $this->reportStatus($assets);
        $this->newLine();
        $this->line('Next: run <fg=yellow>npm run build</> then <fg=yellow>php artisan optimize:clear</>');

        return self::SUCCESS;
    }

    private function reportStatus(InstallPluginAssets $assets): int
    {
        $pagePath = resource_path('js/pages/filemanager/index.tsx');
        $manifestPath = public_path('build/manifest.json');
        $manifestHasPage = File::exists($manifestPath)
            && str_contains(File::get($manifestPath), 'resources/js/pages/filemanager/index.tsx');

        $this->line('Page source: '.($assets->isPublished() ? 'OK' : 'MISSING')." ({$pagePath})");
        $this->line('Sidebar patch: '.($assets->isLayoutPatched() ? 'OK' : 'MISSING'));
        $this->line('Vite manifest: '.($manifestHasPage ? 'OK' : 'MISSING — run npm run build'));

        if (! $assets->isPublished() || ! $assets->isLayoutPatched() || ! $manifestHasPage) {
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
