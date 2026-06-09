import {
  ArchiveIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { FileEntry } from '@/pages/filemanager/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  selectedPath,
  filtered,
  onOpen,
  onEdit,
  onDownload,
  onRename,
  onCopy,
  onExtract,
  onDelete,
}: {
  entries: FileEntry[];
  canWrite: boolean;
  selectedPath: string | null;
  filtered?: boolean;
  onOpen: (entry: FileEntry) => void;
  onEdit: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onRename: (entry: FileEntry) => void;
  onCopy: (entry: FileEntry) => void;
  onExtract: (entry: FileEntry) => void;
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
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Size</TableHead>
          <TableHead className="hidden lg:table-cell">Modified</TableHead>
          <TableHead className="hidden xl:table-cell">Permissions</TableHead>
          <TableHead className="w-12 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.path}
            className={cn('hover:bg-muted/50 cursor-pointer', selectedPath === entry.path && 'bg-muted/50')}
            onClick={() => onOpen(entry)}
          >
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
                      <DropdownMenuItem onSelect={() => onRename(entry)}>
                        <PencilIcon />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onCopy(entry)}>
                        <CopyIcon />
                        Copy here
                      </DropdownMenuItem>
                      {entry.extractable && (
                        <DropdownMenuItem onSelect={() => onExtract(entry)}>
                          <ArchiveIcon />
                          Extract
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(entry)}>
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
