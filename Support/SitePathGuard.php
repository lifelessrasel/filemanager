<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Support;

use App\Models\Site;
use Illuminate\Validation\ValidationException;

final readonly class SitePathGuard
{
    public function __construct(private Site $site) {}

    public function root(): string
    {
        $path = trim((string) ($this->site->path ?? ''));

        if ($path === '') {
            throw ValidationException::withMessages([
                'path' => __('Site path is not configured.'),
            ]);
        }

        return $this->normalize($path);
    }

    /**
     * @throws ValidationException
     */
    public function resolve(?string $path = ''): string
    {
        $root = $this->root();
        $relative = trim(str_replace('\\', '/', (string) $path), '/');

        if ($relative === '') {
            return $root;
        }

        if (str_contains($relative, "\0")) {
            throw ValidationException::withMessages([
                'path' => __('Invalid path.'),
            ]);
        }

        $full = $this->normalize($root.'/'.$relative);

        if ($full !== $root && ! str_starts_with($full, $root.'/')) {
            throw ValidationException::withMessages([
                'path' => __('Path is outside the site directory.'),
            ]);
        }

        return $full;
    }

    /**
     * @throws ValidationException
     */
    public function relative(?string $path = ''): string
    {
        $absolute = $this->resolve($path);
        $root = $this->root();

        if ($absolute === $root) {
            return '';
        }

        return ltrim(substr($absolute, strlen($root)), '/');
    }

    private function normalize(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $parts = array_values(array_filter(explode('/', $path), static fn (string $part): bool => $part !== '' && $part !== '.'));
        $stack = [];

        foreach ($parts as $part) {
            if ($part === '..') {
                array_pop($stack);

                continue;
            }

            $stack[] = $part;
        }

        return '/'.implode('/', $stack);
    }
}
