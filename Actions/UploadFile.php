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
        $tmpRemotePath = '/tmp/vito-fm-'.$tmpName;

        try {
            $ssh = $site->ssh();
            $ssh->upload($localPath, $tmpRemotePath, $site->user, 'filemanager-upload', $site->id);
            $ssh->asUser($site->user)->exec(
                'cat '.escapeshellarg($tmpRemotePath).' > '.escapeshellarg($remotePath),
                'filemanager-upload',
                $site->id
            );
        } finally {
            Storage::disk('local')->delete($storedPath);

            try {
                $site->ssh()->exec('rm -f '.escapeshellarg($tmpRemotePath), 'filemanager-upload', $site->id);
            } catch (Throwable) {
            }
        }
    }
}
