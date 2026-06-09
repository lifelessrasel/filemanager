<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

final readonly class UploadFile
{
    private const CHUNK_SIZE = 524288;

    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     * @throws Throwable
     */
    public function handle(Site $site, array $input): void
    {
        $data = Validator::make($input, [
            'path' => ['nullable', 'string'],
            'file' => ['required', 'file', 'max:51200'],
        ])->validate();

        /** @var UploadedFile $uploadedFile */
        $uploadedFile = $data['file'];

        $guard = new SitePathGuard($site);
        $directory = $guard->resolve($data['path'] ?? '');
        $remotePath = $directory.'/'.basename($uploadedFile->getClientOriginalName());

        $tmpName = Str::random(16);
        $storedPath = $uploadedFile->storeAs('filemanager', $tmpName, 'local');

        if (! is_string($storedPath)) {
            throw ValidationException::withMessages([
                'file' => __('Could not store the uploaded file.'),
            ]);
        }

        $localPath = Storage::disk('local')->path($storedPath);
        $handle = fopen($localPath, 'rb');

        if ($handle === false) {
            Storage::disk('local')->delete($storedPath);

            throw ValidationException::withMessages([
                'file' => __('Could not read the uploaded file.'),
            ]);
        }

        try {
            $append = false;

            while (! feof($handle)) {
                $chunk = fread($handle, self::CHUNK_SIZE);

                if ($chunk === false) {
                    break;
                }

                if ($chunk === '' && $append) {
                    break;
                }

                $site->ssh()->exec(
                    view('filemanager-plugin::upload', [
                        'directory' => $directory,
                        'path' => $remotePath,
                        'encoded' => base64_encode($chunk),
                        'append' => $append,
                    ]),
                    'filemanager-upload',
                    $site->id
                );

                $append = true;
            }
        } finally {
            fclose($handle);
            Storage::disk('local')->delete($storedPath);
        }
    }
}
