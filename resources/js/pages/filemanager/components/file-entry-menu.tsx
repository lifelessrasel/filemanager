import {
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileArchiveIcon,
  FileIcon,
  FolderIcon,
  FolderSymlinkIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
} from 'lucide-react';
import { FileEntry } from '@/pages/filemanager/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function FileEntryMenu({
  entry,
  canWrite,
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
  entry: FileEntry;
  canWrite: boolean;
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
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Actions for ${entry.name}`}>
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
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
        {!canWrite && entry.type === 'file' && (
          <DropdownMenuItem onSelect={() => onDownload(entry)}>
            <FileIcon />
            Download
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
