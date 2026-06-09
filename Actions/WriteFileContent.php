<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class WriteFileContent
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
            'content' => ['present', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path']);

        $site->server->os()->write($absolutePath, $data['content'], $site->user);
    }
}
