<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class CreateFile
{
    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): void
    {
        $data = Validator::make($input, [
            'path' => ['nullable', 'string'],
            'name' => ['required', 'string', 'regex:/^[^\/\\\\]+$/'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $directory = $guard->resolve($data['path']);
        $absolutePath = $directory.'/'.trim($data['name']);

        $site->server->os()->write($absolutePath, '', $site->user);
    }
}
