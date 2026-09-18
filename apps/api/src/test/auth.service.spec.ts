import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../modules/auth/auth.service';
import { User, UserRole, UserStatus } from '../modules/user/entities/user.entity';
import { Organization } from '../modules/organization/entities/organization.entity';
import { Membership } from '../modules/organization/entities/membership.entity';

describe('AuthService — Production Authentication & Admin Bootstrap', () => {
  let service: AuthService;
  let userRepo: any;
  let orgRepo: any;
  let membershipRepo: any;
  let jwtService: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    email: 'admin@gmail.com',
    username: 'admin',
    passwordHash: '',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockAdminUser.passwordHash = await bcrypt.hash('admin@123', 10);

    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'new-user-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'saved-id', ...entity })),
      createQueryBuilder: jest.fn(() => ({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockAdminUser),
      })),
    };

    orgRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'default', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    membershipRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mem-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    jwtService = {
      sign: jest.fn(() => 'mock-valid-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: getRepositoryToken(Membership), useValue: membershipRepo },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((k: string) =>
              k === 'ADMIN_EMAIL' ? 'admin@gmail.com' : k === 'ADMIN_PASSWORD' ? 'admin@123' : null,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('onApplicationBootstrap', () => {
    it('should bootstrap admin@gmail.com with admin@123 if no admin exists', async () => {
      userRepo.findOne.mockResolvedValueOnce(null); // No user found with admin@gmail.com
      orgRepo.findOne.mockResolvedValueOnce(null); // No default org

      await service.onApplicationBootstrap();

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@gmail.com',
          username: 'admin',
          role: UserRole.SUPER_ADMIN,
        }),
      );
      expect(userRepo.save).toHaveBeenCalled();
      expect(orgRepo.save).toHaveBeenCalled();
    });

    it('should NOT overwrite existing admin user on restart', async () => {
      userRepo.findOne.mockResolvedValueOnce(mockAdminUser);

      await service.onApplicationBootstrap();

      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully authenticate admin@gmail.com with admin@123', async () => {
      const result = await service.login({
        email: 'admin@gmail.com',
        password: 'admin@123',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-valid-jwt-token');
      expect(result.user.email).toBe('admin@gmail.com');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockAdminUser.id,
          email: 'admin@gmail.com',
          organizationId: 'default',
        }),
      );
    });

    it('should reject invalid password with UnauthorizedException', async () => {
      await expect(
        service.login({
          email: 'admin@gmail.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject nonexistent email with UnauthorizedException', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
