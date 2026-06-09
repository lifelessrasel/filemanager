import { ChangeEvent, useRef, useState } from 'react';
import {
  ArchiveIcon,
  FilePlusIcon,
  FolderPlusIcon,
  FolderUpIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function FileToolbar({
  canWrite,
  loading,
  onRefresh,
  onCreateFile,
  onCreateDirectory,
  onCompress,
  onUpload,
}: {
  canWrite: boolean;
  loading: boolean;
  onRefresh: () => void;
  onCreateFile: () => void;
  onCreateDirectory: () => void;
  onCompress: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = '';

    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} aria-label="Refresh listing">
        {loading ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {canWrite && (
        <>
          <Button size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="min-w-9">
            {uploading ? <LoaderCircleIcon className="animate-spin" /> : <FolderUpIcon />}
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" size="sm" onClick={onCreateFile}>
              <FilePlusIcon />
              New file
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateDirectory}>
              <FolderPlusIcon />
              New folder
            </Button>
            <Button variant="outline" size="sm" onClick={onCompress}>
              <ArchiveIcon />
              Compress
            </Button>
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden" aria-label="More file actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={onCreateFile}>
                <FilePlusIcon />
                New file
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCreateDirectory}>
                <FolderPlusIcon />
                New folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onCompress}>
                <ArchiveIcon />
                Compress selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input ref={inputRef} type="file" className="hidden" multiple onChange={handleUpload} />
        </>
      )}
    </div>
  );
}
