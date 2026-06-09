<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class RenamePath
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
        $from = $guard->resolve($data['path']);

        if ($from === $guard->root()) {
            throw ValidationException::withMessages([
                'path' => __('The site root directory cannot be renamed.'),
            ]);
        }

        $to = dirname($from).'/'.$data['name'];

        $site->ssh()->exec(
            'mv '.escapeshellarg($from).' '.escapeshellarg($to),
            'filemanager-rename',
            $site->id
        );
    }
}
