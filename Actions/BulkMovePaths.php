<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class BulkMovePaths
{
    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): void
    {
        $data = Validator::make($input, [
            'paths' => ['required', 'array', 'min:1'],
            'paths.*' => ['required', 'string'],
            'destination' => ['nullable', 'string'],
        ])->validate();

        foreach ($data['paths'] as $path) {
            app(MovePath::class)->handle($site, [
                'path' => $path,
                'destination' => $data['destination'] ?? '',
            ]);
        }
    }
}
