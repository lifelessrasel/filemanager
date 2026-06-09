import { ArchiveIcon, CopyIcon, FileArchiveIcon, FolderSymlinkIcon, LoaderCircleIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function BulkActionsBar({
  count,
  canExtract,
  loading,
  onClear,
  onCopy,
  onMove,
  onCompress,
  onUnzip,
  onDelete,
}: {
  count: number;
  canExtract: boolean;
  loading: boolean;
  onClear: () => void;
  onCopy: () => void;
  onMove: () => void;
  onCompress: () => void;
  onUnzip: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-muted/50 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8" onClick={onClear} aria-label="Clear selection">
          <XIcon />
        </Button>
        <span className="text-sm font-medium">
          {count} selected
          {loading && <LoaderCircleIcon className="ml-2 inline size-4 animate-spin" />}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onCopy} disabled={loading}>
          <CopyIcon />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onMove} disabled={loading}>
          <FolderSymlinkIcon />
          Move
        </Button>
        <Button variant="outline" size="sm" onClick={onCompress} disabled={loading}>
          <ArchiveIcon />
          Compress
        </Button>
        {canExtract && (
          <Button variant="outline" size="sm" onClick={onUnzip} disabled={loading}>
            <FileArchiveIcon />
            Unzip
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
          <Trash2Icon />
          Delete
        </Button>
      </div>
    </div>
  );
}
