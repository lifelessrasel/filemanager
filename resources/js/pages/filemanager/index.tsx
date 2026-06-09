import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Head, usePage } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpIcon, LoaderCircleIcon, SearchIcon } from 'lucide-react';
import Container from '@/components/container';
import HeaderContainer from '@/components/header-container';
import Heading from '@/components/heading';
import ServerLayout from '@/layouts/server/layout';
import SiteBanners from '@/components/site-banners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDialog } from '@/hooks/use-dialog';
import BulkActionsBar from '@/pages/filemanager/components/bulk-actions-bar';
import EditFileSheet from '@/pages/filemanager/components/edit-file-sheet';
import FileBreadcrumbs from '@/pages/filemanager/components/file-breadcrumbs';
import FileTable from '@/pages/filemanager/components/file-table';
import FileToolbar from '@/pages/filemanager/components/file-toolbar';
import NameDialog from '@/pages/filemanager/components/name-dialog';
import PathDialog from '@/pages/filemanager/components/path-dialog';
import PermissionsDialog from '@/pages/filemanager/components/permissions-dialog';
import { fileManagerHeaders, getApiErrorMessage, postFormData, postJson } from '@/pages/filemanager/lib/api-client';
import { FileDirectoryListing, FileEntry, FileManagerPageProps } from '@/pages/filemanager/types';
import { SharedData } from '@/types';
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

function FileManagerContent({ server, site, initial_path, can_write }: PageProps) {
  const { csrf_token } = usePage<SharedData>().props;
  const dialog = useDialog();
  const [currentPath, setCurrentPath] = useState(initial_path);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogProcessing, setDialogProcessing] = useState(false);
  const [movePaths, setMovePaths] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [permissionsEntry, setPermissionsEntry] = useState<FileEntry | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissionsProcessing, setPermissionsProcessing] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [editFile, setEditFile] = useState<FileEntry | null>(null);

  const listingQuery = useQuery({
    queryKey: ['site-filemanager', server.id, site.id, currentPath],
    queryFn: async () => {
      const response = await axios.get<FileDirectoryListing>(
        route('site-filemanager.entries', { server: server.id, site: site.id }),
        { params: { path: currentPath }, headers: fileManagerHeaders(csrf_token) },
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

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedPaths.has(entry.path)),
    [entries, selectedPaths],
  );

  const allSelected = filteredEntries.length > 0 && filteredEntries.every((entry) => selectedPaths.has(entry.path));
  const someSelected = filteredEntries.some((entry) => selectedPaths.has(entry.path));
  const canBulkExtract = selectedEntries.some((entry) => entry.extractable);

  useEffect(() => {
    setSelectedPaths(new Set());
    setSelectedEntry(null);
  }, [currentPath]);

  const clearSelection = () => {
    setSelectedPaths(new Set());
    setSelectedEntry(null);
  };

  const toggleSelect = (entry: FileEntry, checked: boolean) => {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(entry.path);
      } else {
        next.delete(entry.path);
      }
      return next;
    });
    setSelectedEntry(entry);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      clearSelection();
      return;
    }

    setSelectedPaths(new Set(filteredEntries.map((entry) => entry.path)));
  };

  const openDialog = (mode: DialogMode) => {
    setDialogError(null);
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setDialogError(null);
    setDialogProcessing(false);
  };

  const mutate = async (url: string, data: Record<string, unknown>, successMessage: string) => {
    await postJson(csrf_token, url, data);
    toast.success(successMessage);
    refresh();
  };

  const runBulk = async (url: string, data: Record<string, unknown>, successMessage: string) => {
    setBulkLoading(true);
    try {
      await mutate(url, data, successMessage);
      clearSelection();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  };

  const openEntry = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
      setSearchQuery('');
      return;
    }

    setSelectedEntry(entry);
    setSelectedPaths(new Set([entry.path]));
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('path', currentPath);
    formData.append('file', file);

    await postFormData(csrf_token, route('site-filemanager.upload', routeParams), formData);
    toast.success(`${file.name} uploaded.`);
    refresh();
  };

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
        setSelectedPaths((current) => {
          const next = new Set(current);
          next.delete(entry.path);
          return next;
        });
        refresh();
      },
    });
  };

  const handleBulkDelete = () => {
    const paths = Array.from(selectedPaths);
    dialog.confirm.open({
      title: `Delete ${paths.length} items?`,
      description: 'This will permanently delete the selected files and folders.',
      variant: 'destructive',
      confirmLabel: 'Delete',
      method: 'post',
      url: route('site-filemanager.bulk.destroy', routeParams),
      data: Object.fromEntries(paths.map((path, index) => [`paths[${index}]`, path])),
      onSuccess: () => {
        toast.success('Deleted successfully.');
        clearSelection();
        refresh();
      },
    });
  };

  const handleCopy = async (entry: FileEntry) => {
    try {
      await mutate(route('site-filemanager.copy', routeParams), { path: entry.path, destination: currentPath }, 'Copied successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleBulkCopy = () => {
    void runBulk(
      route('site-filemanager.bulk.copy', routeParams),
      { paths: Array.from(selectedPaths), destination: currentPath },
      'Copied successfully.',
    );
  };

  const openMoveDialog = (paths: string[]) => {
    setMovePaths(paths);
    setDialogError(null);
    setMoveDialogOpen(true);
  };

  const submitMove = async (destination: string) => {
    setDialogProcessing(true);
    setDialogError(null);

    const targetDestination = destination.trim() === '' ? currentPath : destination.trim();

    try {
      if (movePaths.length === 1) {
        await mutate(
          route('site-filemanager.move', routeParams),
          { path: movePaths[0], destination: targetDestination },
          'Moved successfully.',
        );
      } else {
        await mutate(
          route('site-filemanager.bulk.move', routeParams),
          { paths: movePaths, destination: targetDestination },
          'Moved successfully.',
        );
      }

      setMoveDialogOpen(false);
      clearSelection();
    } catch (error) {
      setDialogError(getApiErrorMessage(error));
    } finally {
      setDialogProcessing(false);
    }
  };

  const handleExtract = async (entry: FileEntry) => {
    try {
      await mutate(route('site-filemanager.extract', routeParams), { path: entry.path }, 'Archive extracted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleBulkUnzip = () => {
    const paths = selectedEntries.filter((entry) => entry.extractable).map((entry) => entry.path);
    if (paths.length === 0) {
      toast.error('Select at least one archive to unzip.');
      return;
    }

    void runBulk(route('site-filemanager.bulk.extract', routeParams), { paths }, 'Archive extracted.');
  };

  const handleDownload = (entry: FileEntry) => {
    window.location.href = `${route('site-filemanager.download', routeParams)}?path=${encodeURIComponent(entry.path)}`;
  };

  const handleCompress = () => {
    const paths = selectedPaths.size > 0 ? Array.from(selectedPaths) : selectedEntry ? [selectedEntry.path] : [];
    if (paths.length === 0) {
      toast.error('Select at least one item to compress.');
      return;
    }

    setSelectedPaths(new Set(paths));
    openDialog('compress');
  };

  const submitPermissions = async (permissions: string) => {
    if (!permissionsEntry) {
      return;
    }

    setPermissionsProcessing(true);
    setPermissionsError(null);

    try {
      await mutate(
        route('site-filemanager.permissions', routeParams),
        { path: permissionsEntry.path, permissions },
        'Permissions updated.',
      );
      setPermissionsEntry(null);
    } catch (error) {
      setPermissionsError(getApiErrorMessage(error));
    } finally {
      setPermissionsProcessing(false);
    }
  };

  const submitNameDialog = async (name: string) => {
    setDialogProcessing(true);
    setDialogError(null);

    try {
      if (dialogMode === 'file') {
        await mutate(route('site-filemanager.files.store', routeParams), { path: currentPath, name }, 'File created.');
      } else if (dialogMode === 'directory') {
        await mutate(route('site-filemanager.directories.store', routeParams), { path: currentPath, name }, 'Directory created.');
      } else if (dialogMode === 'rename' && selectedEntry) {
        await mutate(route('site-filemanager.rename', routeParams), { path: selectedEntry.path, name }, 'Renamed successfully.');
      } else if (dialogMode === 'compress') {
        const paths = Array.from(selectedPaths);
        if (paths.length > 1) {
          await mutate(
            route('site-filemanager.bulk.compress', routeParams),
            { paths, name, destination: currentPath },
            'Archive created.',
          );
        } else if (paths.length === 1) {
          await mutate(route('site-filemanager.compress', routeParams), { path: paths[0], name }, 'Archive created.');
        } else if (selectedEntry) {
          await mutate(route('site-filemanager.compress', routeParams), { path: selectedEntry.path, name }, 'Archive created.');
        }
        clearSelection();
      }

      closeDialog();
    } catch (error) {
      setDialogError(getApiErrorMessage(error));
    } finally {
      setDialogProcessing(false);
    }
  };

  const dialogCopy = {
    file: {
      title: 'Create file',
      description: 'Create a new empty file in this folder.',
      label: 'File name',
      confirmLabel: 'Create',
      defaultValue: '',
    },
    directory: {
      title: 'Create folder',
      description: 'Create a new folder in this location.',
      label: 'Folder name',
      confirmLabel: 'Create',
      defaultValue: '',
    },
    rename: {
      title: 'Rename',
      description: 'Choose a new name for this item.',
      label: 'Name',
      confirmLabel: 'Rename',
      defaultValue: selectedEntry?.name ?? '',
    },
    compress: {
      title: 'Compress',
      description: 'Create a zip archive from the selected items.',
      label: 'Archive name',
      confirmLabel: 'Compress',
      defaultValue: selectedEntries.length === 1 ? `${selectedEntries[0].name}.zip` : 'archive.zip',
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
          onCreateFile={() => openDialog('file')}
          onCreateDirectory={() => openDialog('directory')}
          onCompress={handleCompress}
          onUpload={handleUpload}
        />
      </HeaderContainer>

      <SiteBanners site={site} />

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

        {selectedPaths.size > 0 && can_write && (
          <BulkActionsBar
            count={selectedPaths.size}
            canExtract={canBulkExtract}
            loading={bulkLoading}
            onClear={clearSelection}
            onCopy={handleBulkCopy}
            onMove={() => openMoveDialog(Array.from(selectedPaths))}
            onCompress={handleCompress}
            onUnzip={handleBulkUnzip}
            onDelete={handleBulkDelete}
          />
        )}

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
              selectedPaths={selectedPaths}
              filtered={isFiltering}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onOpen={openEntry}
              onEdit={(entry) => setEditFile(entry)}
              onDownload={handleDownload}
              onRename={(entry) => {
                setSelectedEntry(entry);
                setSelectedPaths(new Set([entry.path]));
                openDialog('rename');
              }}
              onCopy={handleCopy}
              onMove={(entry) => openMoveDialog([entry.path])}
              onExtract={handleExtract}
              onPermissions={(entry) => {
                setPermissionsEntry(entry);
                setPermissionsError(null);
              }}
              onDelete={handleDelete}
            />
            <div className="text-muted-foreground border-t px-4 py-2 text-xs">
              {isFiltering ? `${filteredEntries.length} of ${entries.length}` : entries.length} {entries.length === 1 ? 'item' : 'items'}
              {selectedPaths.size > 0 && (
                <span>
                  {' '}
                  · {selectedPaths.size} selected
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
          onOpenChange={(open) => !open && closeDialog()}
          title={activeDialog.title}
          description={activeDialog.description}
          label={activeDialog.label}
          defaultValue={activeDialog.defaultValue}
          confirmLabel={activeDialog.confirmLabel}
          error={dialogError}
          processing={dialogProcessing}
          onSubmit={submitNameDialog}
        />
      )}

      <PathDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        title={movePaths.length > 1 ? `Move ${movePaths.length} items` : 'Move item'}
        description="Enter the destination folder path relative to the site root. Leave empty to move into the current folder."
        label="Destination folder"
        defaultValue={currentPath}
        confirmLabel="Move"
        error={dialogError}
        processing={dialogProcessing}
        onSubmit={submitMove}
      />

      <PermissionsDialog
        open={permissionsEntry !== null}
        onOpenChange={(open) => !open && setPermissionsEntry(null)}
        defaultValue={permissionsEntry?.permissions ?? '644'}
        error={permissionsError}
        processing={permissionsProcessing}
        onSubmit={submitPermissions}
      />

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
