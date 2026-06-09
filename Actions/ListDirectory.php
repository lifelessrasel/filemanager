<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Actions;

use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final readonly class ListDirectory
{
    /**
     * @param  array<string, mixed>  $input
     * @return array{
     *     path: string,
     *     parent: string|null,
     *     entries: array<int, array<string, mixed>>
     * }
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $input): array
    {
        $data = Validator::make($input, [
            'path' => ['nullable', 'string'],
        ])->validate();

        $guard = new SitePathGuard($site);
        $absolutePath = $guard->resolve($data['path'] ?? '');
        $relativePath = $guard->relative($data['path'] ?? '');

        $output = $site->ssh()->exec('ls -la --time-style=long-iso '.escapeshellarg($absolutePath));
        $entries = $this->parseListing($output, $relativePath, $guard);

        $parent = $relativePath === '' ? null : dirname($relativePath);
        if ($parent === '.') {
            $parent = '';
        }

        return [
            'path' => $relativePath,
            'parent' => $parent,
            'entries' => $entries,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseListing(string $output, string $relativePath, SitePathGuard $guard): array
    {
        $entries = [];

        foreach (preg_split('/\R/', trim($output)) ?: [] as $line) {
            if ($line === '' || str_starts_with($line, 'total ')) {
                continue;
            }

            if (! preg_match('/^([drwx\-]+)\s+(\d+)\s+([\w\-]+)\s+([\w\-]+)\s+(\d+)\s+([\w:\-+\s]+)\s+(.+)$/', $line, $matches)) {
                continue;
            }

            $name = $matches[7];
            if (in_array($name, ['.', '..'], true)) {
                continue;
            }

            $type = match ($matches[1][0]) {
                'd' => 'directory',
                '-' => 'file',
                default => null,
            };

            if ($type === null) {
                continue;
            }

            $entryRelative = $relativePath === '' ? $name : $relativePath.'/'.$name;
            $guard->resolve($entryRelative);

            $extension = pathinfo($name, PATHINFO_EXTENSION);

            $entries[] = [
                'name' => $name,
                'path' => $entryRelative,
                'type' => $type,
                'size' => (int) $matches[5],
                'permissions' => $matches[1],
                'owner' => $matches[3],
                'group' => $matches[4],
                'modified_at' => trim($matches[6]),
                'extractable' => $type === 'file' && in_array(strtolower($extension), ['zip', 'tar', 'gz', 'bz2'], true),
            ];
        }

        usort($entries, function (array $left, array $right): int {
            if ($left['type'] !== $right['type']) {
                return $left['type'] === 'directory' ? -1 : 1;
            }

            return strnatcasecmp($left['name'], $right['name']);
        });

        return $entries;
    }
}
