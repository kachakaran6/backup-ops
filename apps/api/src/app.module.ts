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
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            autoLoadEntities: true,
            synchronize: config.get('NODE_ENV') !== 'production',
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('POSTGRES_HOST', 'localhost'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          username: config.get<string>('POSTGRES_USER', 'backup_ops'),
          password: config.get<string>('POSTGRES_PASSWORD', 'backup_ops_password'),
          database: config.get<string>('POSTGRES_DB', 'backup_ops'),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
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
  ],
})
export class AppModule {}