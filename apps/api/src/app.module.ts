import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CredentialModule } from './modules/credential/credential.module';
import { ResourceModule } from './modules/resource/resource.module';
import { PolicyModule } from './modules/policy/policy.module';
import { JobModule } from './modules/job/job.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';

import { CoolifyModule } from './modules/coolify/coolify.module';
import { ServerModule } from './modules/server/server.module';
import { DatabaseModule } from './modules/database/database.module';
import { StorageModule } from './modules/storage/storage.module';
import { BackupModule } from './modules/backup/backup.module';
import { RestoreModule } from './modules/restore/restore.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        const host = config.get<string>('POSTGRES_HOST');
        const shouldSync =
          config.get<string>('DB_SYNCHRONIZE') === 'true' ||
          config.get<string>('NODE_ENV') !== 'production';

        const baseOptions = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: shouldSync,
          retryAttempts: 10,
          retryDelay: 3000,
        };

        if (host) {
          return {
            ...baseOptions,
            host,
            port: Number(config.get<number>('POSTGRES_PORT', 5432)),
            username: config.get<string>('POSTGRES_USER', 'backup_ops'),
            password: config.get<string>('POSTGRES_PASSWORD', 'changeme123'),
            database: config.get<string>('POSTGRES_DB', 'backup_ops'),
          };
        }

        if (dbUrl) {
          return {
            ...baseOptions,
            url: dbUrl,
          };
        }

        return {
          ...baseOptions,
          host: 'localhost',
          port: 5432,
          username: config.get<string>('POSTGRES_USER', 'backup_ops'),
          password: config.get<string>('POSTGRES_PASSWORD', 'backup_ops_password'),
          database: config.get<string>('POSTGRES_DB', 'backup_ops'),
        };
      },
    }),
    AuthModule,
    UserModule,
    OrganizationModule,
    CredentialModule,
    ResourceModule,
    PolicyModule,
    JobModule,
    AuditModule,
    HealthModule,
    CoolifyModule,
    ServerModule,
    DatabaseModule,
    StorageModule,
    BackupModule,
    RestoreModule,
    MonitoringModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}