<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final readonly class DownloadFile
{
    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     * @throws Throwable
     */
    public function handle(Site $site, array $input): StreamedResponse
    {
        $data = Validator::make($input, [
            'path' => ['required', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path']);
        $downloadName = basename($absolutePath);
        $tmpName = 'filemanager-'.$site->id.'-'.Str::random(12).'-'.$downloadName;
        $tmpPath = Storage::disk('local')->path($tmpName);

        try {
            $site->ssh()->download($tmpPath, $absolutePath, 'filemanager-download', $site->id);
        } catch (Throwable $exception) {
            if (File::exists($tmpPath)) {
                File::delete($tmpPath);
            }

            throw $exception;
        }

        return response()->download($tmpPath, $downloadName)->deleteFileAfterSend(true);
    }
}
