export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified_at: string;
  extractable: boolean;
}

export interface FileDirectoryListing {
  path: string;
  parent: string | null;
  entries: FileEntry[];
}

export interface FileManagerPageProps {
  root_path: string;
  initial_path: string;
  can_write: boolean;
}
