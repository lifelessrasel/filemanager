<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class UpdatePermissions
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
            'permissions' => ['required', 'string', 'regex:/^[0-7]{3,4}$/'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path']);

        $site->ssh()->exec(
            'chmod '.escapeshellarg($data['permissions']).' '.escapeshellarg($absolutePath),
            'filemanager-chmod',
            $site->id
        );
    }
}
