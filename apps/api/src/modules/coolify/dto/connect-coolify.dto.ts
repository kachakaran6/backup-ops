import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class ConnectCoolifyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  /**
   * Coolify API token. Will be encrypted before storage.
   * Never logged, never returned to frontend.
   */
  @IsString()
  @IsNotEmpty()
  apiToken: string;
}
