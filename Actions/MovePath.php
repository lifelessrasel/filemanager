<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class MovePath
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
            'destination' => ['nullable', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $source = $guard->resolve($data['path']);

        if ($source === $guard->root()) {
            throw ValidationException::withMessages([
                'path' => __('The site root directory cannot be moved.'),
            ]);
        }

        $destinationDirectory = $guard->resolve($data['destination'] ?? '');
        $target = $destinationDirectory.'/'.basename($source);

        $site->ssh()->exec(
            'mv '.escapeshellarg($source).' '.escapeshellarg($target),
            'filemanager-move',
            $site->id
        );
    }
}
