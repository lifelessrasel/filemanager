import {
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileArchiveIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderSymlinkIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
} from 'lucide-react';
import { FileEntry } from '@/pages/filemanager/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileTable({
  entries,
  canWrite,
  selectedPaths,
  filtered,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  onOpen,
  onEdit,
  onDownload,
  onRename,
  onCopy,
  onMove,
  onExtract,
  onPermissions,
  onDelete,
}: {
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
}) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center text-sm">
        <FolderOpenIcon className="size-8 opacity-50" />
        <p>{filtered ? 'No files match your search.' : 'This folder is empty.'}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {canWrite && (
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Size</TableHead>
          <TableHead className="hidden lg:table-cell">Modified</TableHead>
          <TableHead className="hidden xl:table-cell">Permissions</TableHead>
          <TableHead className="w-12 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const isSelected = selectedPaths.has(entry.path);

          return (
            <TableRow
              key={entry.path}
              className={cn('hover:bg-muted/50 cursor-pointer', isSelected && 'bg-muted/50')}
              onClick={() => onOpen(entry)}
            >
              {canWrite && (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelect(entry, checked === true)}
                    aria-label={`Select ${entry.name}`}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex min-w-0 items-center gap-2">
                  {entry.type === 'directory' ? (
                    <FolderIcon className="text-primary size-4 shrink-0" />
                  ) : (
                    <FileIcon className="text-muted-foreground size-4 shrink-0" />
                  )}
                  <span className="truncate font-medium">{entry.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {entry.type === 'directory' ? '—' : formatSize(entry.size)}
              </TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">{entry.modified_at}</TableCell>
              <TableCell className="text-muted-foreground hidden font-mono text-xs xl:table-cell">{entry.permissions}</TableCell>
              <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${entry.name}`}>
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {entry.type === 'file' && (
                      <>
                        <DropdownMenuItem onSelect={() => onEdit(entry)}>
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDownload(entry)}>
                          <DownloadIcon />
                          Download
                        </DropdownMenuItem>
                      </>
                    )}
                    {canWrite && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onRename(entry)}>
                          <PencilIcon />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onCopy(entry)}>
                          <CopyIcon />
                          Copy here
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onMove(entry)}>
                          <FolderSymlinkIcon />
                          Move
                        </DropdownMenuItem>
                        {entry.extractable && (
                          <DropdownMenuItem onSelect={() => onExtract(entry)}>
                            <FileArchiveIcon />
                            Unzip
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => onPermissions(entry)}>
                          <ShieldIcon />
                          Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(entry)}>
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {!canWrite && entry.type === 'directory' && (
                      <DropdownMenuItem onSelect={() => onOpen(entry)}>
                        <FolderIcon />
                        Open
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
