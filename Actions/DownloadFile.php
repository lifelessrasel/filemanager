<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final readonly class DownloadFile
{
    private const CHUNK_SIZE = 524288;

    /**
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): StreamedResponse
    {
        $data = Validator::make($input, [
            'path' => ['required', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path']);
        $downloadName = basename($absolutePath);

        $type = trim($site->ssh()->exec(
            view('filemanager-plugin::path-type', [
                'path' => $absolutePath,
            ]),
            'filemanager-download',
            $site->id
        ));

        if ($type === 'directory') {
            throw ValidationException::withMessages([
                'path' => __('Folders cannot be downloaded.'),
            ]);
        }

        if ($type !== 'file') {
            throw ValidationException::withMessages([
                'path' => __('File not found.'),
            ]);
        }

        $ssh = $site->ssh();
        $siteId = $site->id;

        return response()->streamDownload(
            function () use ($ssh, $absolutePath, $siteId): void {
                $skip = 0;

                while (true) {
                    $encoded = trim($ssh->exec(
                        view('filemanager-plugin::download-chunk', [
                            'path' => $absolutePath,
                            'chunkSize' => self::CHUNK_SIZE,
                            'skip' => $skip,
                        ]),
                        'filemanager-download',
                        $siteId
                    ));

                    if ($encoded === '') {
                        break;
                    }

                    $decoded = base64_decode($encoded, true);

                    if ($decoded === false || $decoded === '') {
                        break;
                    }

                    echo $decoded;

                    if (strlen($decoded) < self::CHUNK_SIZE) {
                        break;
                    }

                    $skip++;
                }
            },
            $downloadName,
            ['Content-Type' => 'application/octet-stream']
        );
    }
}
