import { Injectable, UnauthorizedException, ConflictException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { Membership, OrgRole } from '../organization/entities/membership.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.bootstrapDefaultOrganization();
      await this.bootstrapAdminUser();
    } catch (err: any) {
      this.logger.error(`Bootstrap organization/admin error: ${err.message}`, err.stack);
    }
  }

  private async bootstrapDefaultOrganization(): Promise<Organization> {
    let org = await this.orgRepository.findOne({ where: { slug: 'default' } });
    if (!org) {
      org = this.orgRepository.create({
        name: 'Default Workspace',
        slug: 'default',
        description: 'Primary BackupOps Control Plane Workspace',
      });
      org = await this.orgRepository.save(org);
      this.logger.log('Bootstrapped default workspace: Default Workspace (slug: default)');
    }
    return org;
  }

  private async bootstrapAdminUser(): Promise<void> {
    const adminEmail = (
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@gmail.com'
    ).trim().toLowerCase();
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'admin@123';

    try {
      const userByEmail = await this.userRepository.findOne({ where: { email: adminEmail } });
      const userByUsername = await this.userRepository.findOne({ where: { username: 'admin' } });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      let targetUser: User;

      if (userByEmail && userByUsername && userByEmail.id !== userByUsername.id) {
        this.logger.log(`Found conflicting admin accounts (id: ${userByEmail.id}, id: ${userByUsername.id}), consolidating into single admin account`);
        // Remove the orphan email record so userByUsername can take adminEmail safely
        await this.userRepository.delete(userByEmail.id);
        userByUsername.email = adminEmail;
        userByUsername.passwordHash = passwordHash;
        userByUsername.role = UserRole.SUPER_ADMIN;
        userByUsername.status = UserStatus.ACTIVE;
        targetUser = await this.userRepository.save(userByUsername);
      } else if (userByUsername) {
        userByUsername.email = adminEmail;
        userByUsername.passwordHash = passwordHash;
        userByUsername.role = UserRole.SUPER_ADMIN;
        userByUsername.status = UserStatus.ACTIVE;
        targetUser = await this.userRepository.save(userByUsername);
      } else if (userByEmail) {
        userByEmail.username = 'admin';
        userByEmail.passwordHash = passwordHash;
        userByEmail.role = UserRole.SUPER_ADMIN;
        userByEmail.status = UserStatus.ACTIVE;
        targetUser = await this.userRepository.save(userByEmail);
      } else {
        const newUser = this.userRepository.create({
          email: adminEmail,
          username: 'admin',
          displayName: 'System Administrator',
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          preferences: { theme: 'system', language: 'en', timezone: 'UTC' },
        });
        targetUser = await this.userRepository.save(newUser);
      }

      this.logger.log(`Admin account confirmed: email=${targetUser.email}, username=${targetUser.username}, role=${targetUser.role}`);

      // Ensure default membership exists for admin
      const org = await this.bootstrapDefaultOrganization();
      const membership = await this.membershipRepository.findOne({
        where: { organizationId: org.id, userId: targetUser.id },
      });
      if (!membership) {
        const newMembership = this.membershipRepository.create({
          organizationId: org.id,
          userId: targetUser.id,
          role: OrgRole.OWNER,
        });
        await this.membershipRepository.save(newMembership);
      }
    } catch (err: any) {
      this.logger.error(`Failed to bootstrap admin user: ${err.message}`, err.stack);
    }
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email.toLowerCase() }, { username: dto.username.toLowerCase() }],
    });

    if (existing) {
      throw new ConflictException('User with this email or username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const count = await this.userRepository.count();
    const role = count === 0 ? UserRole.SUPER_ADMIN : UserRole.ADMIN;

    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      displayName: dto.displayName,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      preferences: { theme: 'system', language: 'en', timezone: 'UTC' },
    });

    const saved = await this.userRepository.save(user);

    // Ensure user has membership in default org
    const org = await this.bootstrapDefaultOrganization();
    const membership = this.membershipRepository.create({
      organizationId: org.id,
      userId: saved.id,
      role: role === UserRole.SUPER_ADMIN ? OrgRole.OWNER : OrgRole.ADMIN,
    });
    await this.membershipRepository.save(membership);

    return this.generateAuthResponse(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const rawId = (dto.email || dto.usernameOrEmail || '').trim().toLowerCase();

    if (!rawId || !dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :id OR LOWER(user.username) = :id', { id: rawId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: 'default' };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
