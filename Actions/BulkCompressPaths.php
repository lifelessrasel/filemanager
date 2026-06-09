<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class BulkCompressPaths
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
            'name' => ['required', 'string', 'regex:/^[^\/\\\\]+$/'],
            'destination' => ['nullable', 'string'],
        ])->validate();

        if (count($data['paths']) === 1) {
            app(CompressPath::class)->handle($site, [
                'path' => $data['paths'][0],
                'name' => $data['name'],
            ]);

            return;
        }

        $guard = new SitePathGuard($site);
        $destinationDirectory = $guard->resolve($data['destination'] ?? '');
        $zipName = str_ends_with(strtolower($data['name']), '.zip') ? $data['name'] : $data['name'].'.zip';
        $zipPath = $destinationDirectory.'/'.$zipName;

        $absolutePaths = [];
        foreach ($data['paths'] as $path) {
            $absolutePaths[] = $guard->resolve($path);
        }

        $parentDirectory = dirname($absolutePaths[0]);
        foreach ($absolutePaths as $absolutePath) {
            if (dirname($absolutePath) !== $parentDirectory) {
                throw ValidationException::withMessages([
                    'paths' => __('Bulk compress only works for items in the same folder.'),
                ]);
            }
        }

        $basenames = array_map(static fn (string $path): string => basename($path), $absolutePaths);

        $site->ssh()->exec(
            view('filemanager-plugin::bulk-compress', [
                'quotedDirectory' => escapeshellarg($parentDirectory),
                'quotedZipPath' => escapeshellarg($zipPath),
                'quotedItems' => implode(' ', array_map(static fn (string $item): string => escapeshellarg($item), $basenames)),
            ]),
            'filemanager-bulk-compress',
            $site->id
        );
    }
}
