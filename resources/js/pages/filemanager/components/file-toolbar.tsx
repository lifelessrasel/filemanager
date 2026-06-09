import { ChangeEvent, useRef, useState } from 'react';
import {
  ArchiveIcon,
  FilePlusIcon,
  FolderPlusIcon,
  FolderUpIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
          Refresh
        </Button>
        {canWrite && (
          <>
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
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <LoaderCircleIcon className="animate-spin" /> : <FolderUpIcon />}
              Upload
            </Button>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  );
}
