import { IsString, IsOptional } from 'class-validator';

export class BrowseFilesystemDto {
  @IsString()
  @IsOptional()
  path?: string = '/';
}

export interface FilesystemEntry {
  name: string;
  path: string;
  type: 'directory' | 'file';
  sizeBytes?: number;
  modifiedAt?: string;
  permissions?: string;
}

export interface FilesystemBrowseResponse {
  serverId: string;
  serverName: string;
  currentPath: string;
  parentPath: string | null;
  entries: FilesystemEntry[];
  totalEntries: number;
  error?: string;
}
