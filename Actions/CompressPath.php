<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class CompressPath
{
    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): void
    {
        $data = Validator::make($input, [
            'path' => ['required', 'string'],
            'name' => ['required', 'string', 'regex:/^[^\/\\\\]+$/'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $source = $guard->resolve($data['path']);
        $zipName = str_ends_with(strtolower($data['name']), '.zip') ? $data['name'] : $data['name'].'.zip';
        $zipPath = dirname($source).'/'.$zipName;

        $site->server->os()->compress($source, $zipPath);
    }
}
