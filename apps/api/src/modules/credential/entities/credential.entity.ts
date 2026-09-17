import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CredentialType {
  SSH_KEY = 'ssh_key',
  PASSWORD = 'password',
  AWS_S3 = 'aws_s3',
  API_TOKEN = 'api_token',
}

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: CredentialType;

  // Encrypted ciphertext (AES-256-GCM)
  @Column({ select: false })
  ciphertext: string;

  @Column({ select: false })
  iv: string;

  @Column({ select: false })
  authTag: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
