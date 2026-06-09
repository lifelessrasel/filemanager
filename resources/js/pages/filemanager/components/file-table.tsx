import {
  FileArchiveIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { FileEntry } from '@/pages/filemanager/types';
import FileEntryMenu from '@/pages/filemanager/components/file-entry-menu';
import { formatFileSize, formatModifiedAt } from '@/pages/filemanager/lib/format';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type FileTableProps = {
  entries: FileEntry[];
  canWrite: boolean;
  selectedPaths: Set<string>;
  filtered?: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelect: (entry: FileEntry, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onOpen: (entry: FileEntry) => void;
  onEdit: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onRename: (entry: FileEntry) => void;
  onCopy: (entry: FileEntry) => void;
  onMove: (entry: FileEntry) => void;
  onExtract: (entry: FileEntry) => void;
  onPermissions: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
};

function EntryIcon({ entry }: { entry: FileEntry }) {
  if (entry.type === 'directory') {
    return <FolderIcon className="text-primary size-4 shrink-0" />;
  }

  if (entry.extractable) {
    return <FileArchiveIcon className="text-muted-foreground size-4 shrink-0" />;
  }

  return <FileIcon className="text-muted-foreground size-4 shrink-0" />;
}

function entryMenuProps(props: FileTableProps, entry: FileEntry) {
  return {
    entry,
    canWrite: props.canWrite,
    onOpen: props.onOpen,
    onEdit: props.onEdit,
    onDownload: props.onDownload,
    onRename: props.onRename,
    onCopy: props.onCopy,
    onMove: props.onMove,
    onExtract: props.onExtract,
    onPermissions: props.onPermissions,
    onDelete: props.onDelete,
  };
}

export default function FileTable(props: FileTableProps) {
  const {
    entries,
    canWrite,
    selectedPaths,
    filtered,
    allSelected,
    someSelected,
    onToggleSelect,
    onToggleSelectAll,
    onOpen,
  } = props;

  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="bg-muted/60 flex size-14 items-center justify-center rounded-full">
          <FolderOpenIcon className="size-7 opacity-60" />
        </div>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">{filtered ? 'No matches found' : 'This folder is empty'}</p>
          <p className="text-xs">{filtered ? 'Try a different search term.' : 'Upload files or create a new folder to get started.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        {canWrite && (
          <div className="bg-muted/20 flex items-center gap-3 border-b px-4 py-2.5">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
              aria-label="Select all"
            />
            <span className="text-muted-foreground text-xs font-medium">Select all</span>
          </div>
        )}
        <div className="divide-y">
          {entries.map((entry) => {
            const isSelected = selectedPaths.has(entry.path);

            return (
              <div
                key={entry.path}
                className={cn(
                  'flex items-start gap-2 px-3 py-3 transition-colors sm:px-4',
                  isSelected && 'bg-primary/5',
                )}
              >
                {canWrite && (
                  <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelect(entry, checked === true)}
                      aria-label={`Select ${entry.name}`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                  onClick={() => onOpen(entry)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <EntryIcon entry={entry} />
                    <span className="truncate text-sm font-medium">{entry.name}</span>
                  </span>
                  <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span>{entry.type === 'directory' ? 'Folder' : formatFileSize(entry.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatModifiedAt(entry.modified_at)}</span>
                  </span>
                </button>
                <FileEntryMenu {...entryMenuProps(props, entry)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {canWrite && (
                <TableHead className="w-11 pl-4">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead className="min-w-[12rem]">Name</TableHead>
              <TableHead className="hidden w-28 lg:table-cell">Size</TableHead>
              <TableHead className="hidden w-44 xl:table-cell">Modified</TableHead>
              <TableHead className="hidden w-32 2xl:table-cell">Permissions</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isSelected = selectedPaths.has(entry.path);

              return (
                <TableRow
                  key={entry.path}
                  className={cn('group cursor-pointer', isSelected && 'bg-primary/5 hover:bg-primary/5')}
                  onClick={() => onOpen(entry)}
                >
                  {canWrite && (
                    <TableCell className="pl-4" onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onToggleSelect(entry, checked === true)}
                        aria-label={`Select ${entry.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <EntryIcon entry={entry} />
                      <span className="truncate font-medium">{entry.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {entry.type === 'directory' ? '—' : formatFileSize(entry.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden xl:table-cell">{formatModifiedAt(entry.modified_at)}</TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs 2xl:table-cell">{entry.permissions}</TableCell>
                  <TableCell className="pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <FileEntryMenu {...entryMenuProps(props, entry)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
