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

        try {
            Storage::disk('local')->putFileAs('', $uploadedFile, $tmpName);
            $storedPath = Storage::disk('local')->path($tmpName);
            $site->ssh()->upload($storedPath, $remotePath, $site->user, 'filemanager-upload', $site->id);
        } finally {
            if (Storage::disk('local')->exists($tmpName)) {
                Storage::disk('local')->delete($tmpName);
            }
        }
    }
}
