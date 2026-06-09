import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { Head, usePage } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpIcon } from 'lucide-react';
import Container from '@/components/container';
import HeaderContainer from '@/components/header-container';
import Heading from '@/components/heading';
import ServerLayout from '@/layouts/server/layout';
import SiteBanners from '@/components/site-banners';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

export default function FileManager() {
  const page = usePage<{ server: Server; site: Site } & FileManagerPageProps>();
  const dialog = useDialog();
  const [currentPath, setCurrentPath] = useState(page.props.initial_path);
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editFile, setEditFile] = useState<FileEntry | null>(null);

  const canWrite = page.props.can_write;

  const listingQuery = useQuery({
    queryKey: ['site-filemanager', page.props.server.id, page.props.site.id, currentPath],
    queryFn: async () => {
      const response = await axios.get<FileDirectoryListing>(
        route('site-filemanager.entries', { server: page.props.server.id, site: page.props.site.id }),
        { params: { path: currentPath } },
      );

      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(() => {
    listingQuery.refetch();
  }, [listingQuery]);

  const routeParams = useMemo(
    () => ({ server: page.props.server.id, site: page.props.site.id }),
    [page.props.server.id, page.props.site.id],
  );

  const post = async (url: string, data: Record<string, unknown>) => {
    await axios.post(url, data);
    refresh();
  };

  const openEntry = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
      setSelectedEntry(null);
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

  return (
    <ServerLayout>
      <Head title={`File Manager - ${page.props.site.domain}`} />

      <Container className="max-w-6xl">
        <HeaderContainer>
          <Heading
            title="File Manager"
            description={`Manage files for ${page.props.site.domain}. Root: ${page.props.root_path}`}
          />
        </HeaderContainer>

        <SiteBanners site={page.props.site} />

        <Alert>
          <AlertDescription>
            Files are managed over SSH as the site user. Large uploads pass through your Vito instance before reaching the server.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="gap-4 space-y-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <FileBreadcrumbs path={currentPath} rootLabel={page.props.site.domain} onNavigate={setCurrentPath} />
              {listingQuery.data?.parent !== null && listingQuery.data?.parent !== undefined && (
                <Button variant="outline" size="sm" onClick={() => setCurrentPath(listingQuery.data?.parent ?? '')}>
                  <ArrowUpIcon />
                  Up
                </Button>
              )}
            </div>
            <FileToolbar
              canWrite={canWrite}
              loading={listingQuery.isFetching}
              onRefresh={refresh}
              onCreateFile={() => setDialogMode('file')}
              onCreateDirectory={() => setDialogMode('directory')}
              onCompress={() => {
                if (!selectedEntry) {
                  toast.error('Select a file or folder to compress.');
                  return;
                }
                setDialogMode('compress');
              }}
              onUpload={uploadFile}
            />
          </CardHeader>
          <CardContent>
            {listingQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : listingQuery.isError ? (
              <div className="text-destructive flex min-h-48 items-center justify-center rounded-lg border border-dashed">
                Failed to load directory contents.
              </div>
            ) : (
              <FileTable
                entries={listingQuery.data?.entries ?? []}
                canWrite={canWrite}
                selectedPath={selectedEntry?.path ?? null}
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
            )}
          </CardContent>
        </Card>
      </Container>

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
        server={page.props.server}
        site={page.props.site}
        file={editFile}
        onSaved={refresh}
      />
    </ServerLayout>
  );
}
