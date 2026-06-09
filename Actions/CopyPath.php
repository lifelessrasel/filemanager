<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class CopyPath
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
            'destination' => ['required', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $source = $guard->resolve($data['path']);
        $destinationDirectory = $guard->resolve($data['destination']);
        $destination = $destinationDirectory.'/'.basename($source);

        $site->ssh()->exec(
            'cp -r '.escapeshellarg($source).' '.escapeshellarg($destination),
            'filemanager-copy',
            $site->id
        );
    }
}
