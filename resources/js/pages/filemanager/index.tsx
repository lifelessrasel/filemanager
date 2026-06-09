import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { Head, usePage } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpIcon, LoaderCircleIcon, SearchIcon } from 'lucide-react';
import Container from '@/components/container';
import CopyableBadge from '@/components/copyable-badge';
import HeaderContainer from '@/components/header-container';
import Heading from '@/components/heading';
import ServerLayout from '@/layouts/server/layout';
import SiteBanners from '@/components/site-banners';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDialog } from '@/hooks/use-dialog';
import EditFileSheet from '@/pages/filemanager/components/edit-file-sheet';
import FileBreadcrumbs from '@/pages/filemanager/components/file-breadcrumbs';
import FileTable from '@/pages/filemanager/components/file-table';
import FileToolbar from '@/pages/filemanager/components/file-toolbar';
import NameDialog from '@/pages/filemanager/components/name-dialog';
import { FileDirectoryListing, FileEntry, FileManagerPageProps } from '@/pages/filemanager/types';
import { Server } from '@/types/server';
import { Site } from '@/types/site';
import { toast } from 'sonner';

type DialogMode = 'file' | 'directory' | 'rename' | 'compress';

type PageProps = { server: Server; site: Site } & FileManagerPageProps;

export default function FileManager() {
  const page = usePage<PageProps>();

  return (
    <ServerLayout>
      <Head title={`File Manager - ${page.props.site.domain}`} />
      <FileManagerContent {...page.props} />
    </ServerLayout>
  );
}

function FileManagerContent({ server, site, initial_path, root_path, can_write }: PageProps) {
  const dialog = useDialog();
  const [currentPath, setCurrentPath] = useState(initial_path);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editFile, setEditFile] = useState<FileEntry | null>(null);

  const listingQuery = useQuery({
    queryKey: ['site-filemanager', server.id, site.id, currentPath],
    queryFn: async () => {
      const response = await axios.get<FileDirectoryListing>(
        route('site-filemanager.entries', { server: server.id, site: site.id }),
        { params: { path: currentPath } },
      );

      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(() => {
    listingQuery.refetch();
  }, [listingQuery]);

  const routeParams = useMemo(() => ({ server: server.id, site: site.id }), [server.id, site.id]);

  const entries = listingQuery.data?.entries ?? [];

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return entries;
    }

    return entries.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [entries, searchQuery]);

  const post = async (url: string, data: Record<string, unknown>) => {
    await axios.post(url, data);
    refresh();
  };

  const openEntry = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
      setSelectedEntry(null);
      setSearchQuery('');
      return;
    }

    setSelectedEntry(entry);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('path', currentPath);
    formData.append('file', file);

    try {
      await axios.post(route('site-filemanager.upload', routeParams), formData);
      toast.success('File uploaded.');
      refresh();
    } catch {
      toast.error('Failed to upload file.');
    }
  };

  const handleDelete = (entry: FileEntry) => {
    dialog.confirm.open({
      title: `Delete ${entry.name}?`,
      description: `This will permanently delete ${entry.type === 'directory' ? 'the folder and its contents' : 'this file'}.`,
      variant: 'destructive',
      confirmLabel: 'Delete',
      method: 'delete',
      url: route('site-filemanager.entries.destroy', routeParams),
      data: { path: entry.path },
      onSuccess: () => {
        toast.success('Deleted successfully.');
        if (selectedEntry?.path === entry.path) {
          setSelectedEntry(null);
        }
        refresh();
      },
    });
  };

  const handleCopy = async (entry: FileEntry) => {
    try {
      await post(route('site-filemanager.copy', routeParams), {
        path: entry.path,
        destination: currentPath,
      });
      toast.success('Copied successfully.');
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const handleExtract = async (entry: FileEntry) => {
    try {
      await post(route('site-filemanager.extract', routeParams), { path: entry.path });
      toast.success('Archive extracted.');
    } catch {
      toast.error('Failed to extract archive.');
    }
  };

  const handleDownload = (entry: FileEntry) => {
    window.location.href = `${route('site-filemanager.download', routeParams)}?path=${encodeURIComponent(entry.path)}`;
  };

  const handleCompress = () => {
    if (!selectedEntry) {
      toast.error('Select a file or folder to compress.');
      return;
    }
    setDialogMode('compress');
  };

  const submitNameDialog = async (name: string) => {
    try {
      if (dialogMode === 'file') {
        await post(route('site-filemanager.files.store', routeParams), { path: currentPath, name });
        toast.success('File created.');
      } else if (dialogMode === 'directory') {
        await post(route('site-filemanager.directories.store', routeParams), { path: currentPath, name });
        toast.success('Directory created.');
      } else if (dialogMode === 'rename' && selectedEntry) {
        await post(route('site-filemanager.rename', routeParams), { path: selectedEntry.path, name });
        toast.success('Renamed successfully.');
      } else if (dialogMode === 'compress' && selectedEntry) {
        await post(route('site-filemanager.compress', routeParams), { path: selectedEntry.path, name });
        toast.success('Archive created.');
      }
    } catch {
      toast.error('Action failed.');
    }
  };

  const dialogCopy = {
    file: {
      title: 'Create file',
      description: 'Create a new empty file in the current directory.',
      label: 'File name',
      confirmLabel: 'Create',
      defaultValue: '',
    },
    directory: {
      title: 'Create folder',
      description: 'Create a new folder in the current directory.',
      label: 'Folder name',
      confirmLabel: 'Create',
      defaultValue: '',
    },
    rename: {
      title: 'Rename',
      description: 'Enter a new name for the selected item.',
      label: 'Name',
      confirmLabel: 'Rename',
      defaultValue: selectedEntry?.name ?? '',
    },
    compress: {
      title: 'Compress',
      description: 'Create a zip archive from the selected item.',
      label: 'Archive name',
      confirmLabel: 'Compress',
      defaultValue: selectedEntry ? `${selectedEntry.name}.zip` : 'archive.zip',
    },
  } as const;

  const activeDialog = dialogMode ? dialogCopy[dialogMode] : null;
  const isFiltering = searchQuery.trim().length > 0;
  const showUpButton = listingQuery.data?.parent !== null && listingQuery.data?.parent !== undefined;

  return (
    <Container className="max-w-5xl">
      <HeaderContainer>
        <Heading title="File Manager" description={`Browse and manage files for ${site.domain}`} />
        <FileToolbar
          canWrite={can_write}
          loading={listingQuery.isFetching}
          onRefresh={refresh}
          onCreateFile={() => setDialogMode('file')}
          onCreateDirectory={() => setDialogMode('directory')}
          onCompress={handleCompress}
          onUpload={uploadFile}
        />
      </HeaderContainer>

      <SiteBanners site={site} />

      <Card>
        <CardContent className="text-muted-foreground flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>Files are managed over SSH as the site user. Uploads pass through Vito before reaching the server.</p>
          <CopyableBadge text={root_path} tooltip />
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-md border shadow-xs">
        <div className="bg-muted/30 flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <FileBreadcrumbs path={currentPath} rootLabel={site.domain} onNavigate={setCurrentPath} />
          <div className="flex flex-wrap items-center gap-2">
            {showUpButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPath(listingQuery.data?.parent ?? '');
                  setSearchQuery('');
                }}
              >
                <ArrowUpIcon />
                Up
              </Button>
            )}
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter files..."
                className="pl-8"
              />
            </div>
            {listingQuery.isFetching && !listingQuery.isLoading && (
              <LoaderCircleIcon className="text-muted-foreground size-4 animate-spin" />
            )}
          </div>
        </div>

        {listingQuery.isLoading ? (
          <div className="space-y-0 p-4">
            <Skeleton className="mb-3 h-10 w-full" />
            <Skeleton className="mb-3 h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : listingQuery.isError ? (
          <div className="text-muted-foreground flex min-h-48 items-center justify-center p-6 text-sm">
            Failed to load directory contents. Try refreshing.
          </div>
        ) : (
          <>
            <FileTable
              entries={filteredEntries}
              canWrite={can_write}
              selectedPath={selectedEntry?.path ?? null}
              filtered={isFiltering}
              onOpen={openEntry}
              onEdit={(entry) => setEditFile(entry)}
              onDownload={handleDownload}
              onRename={(entry) => {
                setSelectedEntry(entry);
                setDialogMode('rename');
              }}
              onCopy={handleCopy}
              onExtract={handleExtract}
              onDelete={handleDelete}
            />
            <div className="text-muted-foreground flex flex-col gap-1 border-t px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span>
                {isFiltering ? `${filteredEntries.length} of ${entries.length}` : entries.length}{' '}
                {entries.length === 1 ? 'item' : 'items'}
              </span>
              {selectedEntry && (
                <span>
                  Selected: <span className="text-foreground font-medium">{selectedEntry.name}</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {activeDialog && (
        <NameDialog
          key={dialogMode ?? 'closed'}
          open={dialogMode !== null}
          onOpenChange={(open) => !open && setDialogMode(null)}
          title={activeDialog.title}
          description={activeDialog.description}
          label={activeDialog.label}
          defaultValue={activeDialog.defaultValue}
          confirmLabel={activeDialog.confirmLabel}
          onSubmit={submitNameDialog}
        />
      )}

      <EditFileSheet
        open={editFile !== null}
        onOpenChange={(open) => !open && setEditFile(null)}
        server={server}
        site={site}
        file={editFile}
        onSaved={refresh}
      />
    </Container>
  );
}
