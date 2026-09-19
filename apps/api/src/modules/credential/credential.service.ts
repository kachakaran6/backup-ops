import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Credential } from './entities/credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialService {
  private encryptionKey: Buffer;

  constructor(
    @InjectRepository(Credential)
    private credentialRepo: Repository<Credential>,
    private configService: ConfigService,
  ) {
    const rawKey = this.configService.get<string>(
      'BACKUP_OPS_ENCRYPTION_KEY',
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    // Ensure 32-byte key for AES-256
    this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  async create(organizationId: string, dto: CreateCredentialDto): Promise<Omit<Credential, 'ciphertext' | 'iv' | 'authTag'>> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const serializedPayload = JSON.stringify(dto.secretPayload);
    let ciphertext = cipher.update(serializedPayload, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const cred = this.credentialRepo.create({
      organizationId,
      name: dto.name,
      type: dto.type,
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
      metadata: dto.metadata || {},
    });

    const saved = await this.credentialRepo.save(cred);
    return this.sanitize(saved);
  }

  async findAll(organizationId: string): Promise<Array<Omit<Credential, 'ciphertext' | 'iv' | 'authTag'>>> {
    const creds = await this.credentialRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
    return creds.map((c) => this.sanitize(c));
  }

  async findOne(organizationId: string, id: string): Promise<Omit<Credential, 'ciphertext' | 'iv' | 'authTag'>> {
    const cred = await this.credentialRepo.findOne({ where: { id, organizationId } });
    if (!cred) {
      throw new NotFoundException(`Credential ${id} not found`);
    }
    return this.sanitize(cred);
  }

  async update(
    organizationId: string,
    id: string,
    dto: { name?: string; secretPayload?: Record<string, any>; metadata?: Record<string, any> },
  ): Promise<Omit<Credential, 'ciphertext' | 'iv' | 'authTag'>> {
    const cred = await this.credentialRepo.findOne({ where: { id, organizationId } });
    if (!cred) {
      throw new NotFoundException(`Credential ${id} not found`);
    }

    if (dto.name) cred.name = dto.name;
    if (dto.metadata) cred.metadata = dto.metadata;

    if (dto.secretPayload) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      let ciphertext = cipher.update(JSON.stringify(dto.secretPayload), 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      cred.ciphertext = ciphertext;
      cred.iv = iv.toString('hex');
      cred.authTag = authTag;
    }

    const saved = await this.credentialRepo.save(cred);
    return this.sanitize(saved);
  }

  /**
   * Internal decrypt method for providers, connection testers, and workers only.
   * NEVER exposed directly to public HTTP responses.
   */
  async decryptSecret(id: string): Promise<Record<string, any>> {
    const cred = await this.credentialRepo
      .createQueryBuilder('cred')
      .addSelect(['cred.ciphertext', 'cred.iv', 'cred.authTag'])
      .where('cred.id = :id', { id })
      .getOne();

    if (!cred) {
      throw new NotFoundException(`Credential ${id} not found`);
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(cred.iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(cred.authTag, 'hex'));

    let decrypted = decipher.update(cred.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const cred = await this.credentialRepo.findOne({ where: { id, organizationId } });
    if (!cred) {
      throw new NotFoundException(`Credential ${id} not found`);
    }
    await this.credentialRepo.remove(cred);
  }

  private sanitize(cred: Credential): Omit<Credential, 'ciphertext' | 'iv' | 'authTag'> {
    const { ciphertext, iv, authTag, ...safe } = cred;
    return safe;
  }
}
