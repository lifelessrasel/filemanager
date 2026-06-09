<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class ReadFileContent
{
    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): string
    {
        $data = Validator::make($input, [
            'path' => ['required', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path']);

        return $site->ssh()->exec('cat '.escapeshellarg($absolutePath));
    }
}
