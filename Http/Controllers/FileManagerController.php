<?php

namespace App\Vito\Plugins\Lifelessrasel\Filemanager\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Models\Site;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\CompressPath;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\CopyPath;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\CreateDirectory;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\CreateFile;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\DeletePath;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\DownloadFile;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\ExtractArchive;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\ListDirectory;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\ReadFileContent;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\RenamePath;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\UploadFile;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Actions\WriteFileContent;
use App\Vito\Plugins\Lifelessrasel\Filemanager\Support\SitePathGuard;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileManagerController extends Controller
{
    public function index(Request $request, Server $server, Site $site): Response
    {
        $this->authorize('view', [$site, $server]);
        $this->ensureReady($site);

        $guard = new SitePathGuard($site);

        return Inertia::render('filemanager/index', [
            'root_path' => $guard->root(),
            'initial_path' => '',
            'can_write' => $request->user()?->can('update', [$site, $server]) ?? false,
        ]);
    }

    public function entries(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('view', [$site, $server]);
        $this->ensureReady($site);

        return response()->json(app(ListDirectory::class)->handle($site, $request->all()));
    }

    public function content(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('view', [$site, $server]);
        $this->ensureReady($site);

        return response()->json([
            'content' => app(ReadFileContent::class)->handle($site, $request->all()),
        ]);
    }

    public function updateContent(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(WriteFileContent::class)->handle($site, $request->all());

        return response()->json(['message' => 'File saved.']);
    }

    public function createFile(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(CreateFile::class)->handle($site, $request->all());

        return response()->json(['message' => 'File created.']);
    }

    public function createDirectory(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(CreateDirectory::class)->handle($site, $request->all());

        return response()->json(['message' => 'Directory created.']);
    }

    public function upload(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(UploadFile::class)->handle($site, $request->all());

        return response()->json(['message' => 'File uploaded.']);
    }

    public function download(Request $request, Server $server, Site $site): StreamedResponse
    {
        $this->authorize('view', [$site, $server]);
        $this->ensureReady($site);

        return app(DownloadFile::class)->handle($site, $request->all());
    }

    public function destroy(Request $request, Server $server, Site $site): RedirectResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(DeletePath::class)->handle($site, $request->all());

        return back()->with('success', 'Deleted successfully.');
    }

    public function extract(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(ExtractArchive::class)->handle($site, $request->all());

        return response()->json(['message' => 'Archive extracted.']);
    }

    public function rename(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(RenamePath::class)->handle($site, $request->all());

        return response()->json(['message' => 'Renamed successfully.']);
    }

    public function copy(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(CopyPath::class)->handle($site, $request->all());

        return response()->json(['message' => 'Copied successfully.']);
    }

    public function compress(Request $request, Server $server, Site $site): JsonResponse
    {
        $this->authorize('update', [$site, $server]);
        $this->ensureReady($site);

        app(CompressPath::class)->handle($site, $request->all());

        return response()->json(['message' => 'Archive created.']);
    }

    /**
     * @throws AuthorizationException
     */
    private function ensureReady(Site $site): void
    {
        if (! $site->isReady()) {
            throw new AuthorizationException;
        }
    }
}
