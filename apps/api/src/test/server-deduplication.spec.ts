import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServerService } from '../modules/server/server.service';
import { Server, ServerConnectionMode, ServerStatus } from '../modules/server/entities/server.entity';
import { Database } from '../modules/database/entities/database.entity';
import { CredentialService } from '../modules/credential/credential.service';

describe('ServerService — Server Identity & Deduplication', () => {
  let service: ServerService;
  let serverRepo: any;
  let dbRepo: any;

  beforeEach(async () => {
    serverRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'server-uuid', ...entity })),
      remove: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    dbRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerService,
        { provide: getRepositoryToken(Server), useValue: serverRepo },
        { provide: getRepositoryToken(Database), useValue: dbRepo },
        { provide: CredentialService, useValue: { create: jest.fn().mockResolvedValue({ id: 'cred-1' }) } },
      ],
    }).compile();

    service = module.get<ServerService>(ServerService);
    jest.spyOn(service, 'testSshConnection').mockResolvedValue({
      success: true,
      latencyMs: 35,
      message: 'SSH daemon reachable',
      os: 'Linux (Ubuntu 24.04)',
      arch: 'x86_64',
      dockerRunning: true,
    });
  });

  describe('deduplicateServers', () => {
    it('should detect and remove duplicate servers with identical IP host', async () => {
      const server1 = {
        id: 'srv-1',
        organizationId: 'default',
        name: 'Primary Server',
        host: '192.168.1.100',
        port: 22,
        connectionMode: ServerConnectionMode.SSH,
        status: ServerStatus.ONLINE,
        createdAt: new Date('2026-01-01'),
      };
      const server2Duplicate = {
        id: 'srv-2',
        organizationId: 'default',
        name: 'Primary Server (Duplicate)',
        host: '192.168.1.100',
        port: 22,
        connectionMode: ServerConnectionMode.COOLIFY,
        coolifyConnectionId: 'cool-1',
        coolifyServerUuid: 'uuid-100',
        status: ServerStatus.ONLINE,
        createdAt: new Date('2026-01-02'),
      };

      serverRepo.find.mockResolvedValueOnce([server1, server2Duplicate]);

      const duplicatesRemoved = await service.deduplicateServers('default');

      expect(duplicatesRemoved).toBe(1);
      // Reassigned child databases to canonical server
      expect(dbRepo.update).toHaveBeenCalledWith(
        { serverId: 'srv-2' },
        { serverId: 'srv-1' },
      );
      expect(serverRepo.remove).toHaveBeenCalledWith(server2Duplicate);
    });

    it('should keep unique servers untouched', async () => {
      const server1 = {
        id: 'srv-1',
        organizationId: 'default',
        name: 'Web Server',
        host: '192.168.1.10',
        port: 22,
        createdAt: new Date(),
      };
      const server2 = {
        id: 'srv-2',
        organizationId: 'default',
        name: 'DB Server',
        host: '192.168.1.20',
        port: 22,
        createdAt: new Date(),
      };

      serverRepo.find.mockResolvedValueOnce([server1, server2]);

      const duplicatesRemoved = await service.deduplicateServers('default');

      expect(duplicatesRemoved).toBe(0);
      expect(serverRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('createDirectSshServer', () => {
    it('should reconcile and update existing server record instead of creating duplicate', async () => {
      const existing = {
        id: 'existing-srv',
        organizationId: 'default',
        name: 'Existing Host',
        host: '10.0.0.5',
        port: 22,
        username: 'root',
        status: ServerStatus.ONLINE,
      };
      serverRepo.findOne.mockResolvedValueOnce(existing);

      const result = await service.createDirectSshServer('default', {
        name: 'Updated Host Name',
        host: '10.0.0.5',
        port: 22,
        username: 'ubuntu',
      });

      expect(result.id).toBe('existing-srv');
      expect(serverRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-srv',
          name: 'Updated Host Name',
        }),
      );
    });
  });
});
