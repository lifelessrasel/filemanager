<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager;

use App\Plugins\AbstractPlugin;
use App\Plugins\RegisterViews;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\InstallPluginAssets;
use Illuminate\Support\Facades\Route;

class Plugin extends AbstractPlugin
{
    protected string $name = 'File Manager';

    protected string $description = 'Browse and manage site files over SSH from the VitoDeploy dashboard';

    public function boot(): void
    {
        RegisterViews::make('filemanager-plugin')
            ->path(__DIR__.'/views')
            ->register();

        Route::middleware(['web', 'auth', 'has-project'])
            ->group(__DIR__.'/routes/web.php');

        $this->ensureAssetsPublished();
    }

    private function ensureAssetsPublished(): void
    {
        $assets = app(InstallPluginAssets::class);

        if ($assets->isPublished() && $assets->isLayoutPatched()) {
            return;
        }

        $assets->install(__DIR__);
    }

    public function install(): void
    {
        app(InstallPluginAssets::class)->install(__DIR__);
    }

    public function uninstall(): void
    {
        app(InstallPluginAssets::class)->uninstall();
    }

    public function enable(): void
    {
        app(InstallPluginAssets::class)->install(__DIR__);
    }

    public function disable(): void
    {
        app(InstallPluginAssets::class)->uninstall();
    }
}
