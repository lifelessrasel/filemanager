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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={onRefresh} disabled={loading} aria-label="Refresh">
        {loading ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
        <span className="hidden lg:block">Refresh</span>
      </Button>
      {canWrite && (
        <>
          <Button variant="outline" onClick={onCreateFile}>
            <FilePlusIcon />
            <span className="hidden lg:block">New file</span>
          </Button>
          <Button variant="outline" onClick={onCreateDirectory}>
            <FolderPlusIcon />
            <span className="hidden lg:block">New folder</span>
          </Button>
          <Button disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <LoaderCircleIcon className="animate-spin" /> : <FolderUpIcon />}
            <span className="hidden lg:block">Upload</span>
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="p-0" aria-label="More actions">
                <span className="sr-only">More actions</span>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
