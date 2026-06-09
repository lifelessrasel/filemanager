import { ArchiveIcon, CopyIcon, FileArchiveIcon, FolderSymlinkIcon, LoaderCircleIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="bg-primary/5 supports-[backdrop-filter]:bg-primary/5 sticky top-0 z-10 border-b px-3 py-3 backdrop-blur-sm sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClear} aria-label="Clear selection">
            <XIcon />
          </Button>
          <Badge variant="default">{count} selected</Badge>
          {loading && <LoaderCircleIcon className="text-muted-foreground size-4 animate-spin" aria-label="Processing" />}
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button variant="outline" size="sm" className="shrink-0" onClick={onCopy} disabled={loading}>
            <CopyIcon />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" onClick={onMove} disabled={loading}>
            <FolderSymlinkIcon />
            <span className="hidden sm:inline">Move</span>
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" onClick={onCompress} disabled={loading}>
            <ArchiveIcon />
            <span className="hidden sm:inline">Compress</span>
          </Button>
          {canExtract && (
            <Button variant="outline" size="sm" className="shrink-0" onClick={onUnzip} disabled={loading}>
              <FileArchiveIcon />
              <span className="hidden sm:inline">Unzip</span>
            </Button>
          )}
          <Button variant="destructive" size="sm" className="shrink-0" onClick={onDelete} disabled={loading}>
            <Trash2Icon />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
