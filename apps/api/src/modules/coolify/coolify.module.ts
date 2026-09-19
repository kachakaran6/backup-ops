import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoolifyConnection } from './entities/coolify-connection.entity';
import { CoolifyProvider } from './coolify.provider';
import { CoolifyService } from './coolify.service';
import { CoolifyController } from './coolify.controller';
import { Server } from '../server/entities/server.entity';
import { Database } from '../database/entities/database.entity';

import { CredentialModule } from '../credential/credential.module';

@Module({
  imports: [TypeOrmModule.forFeature([CoolifyConnection, Server, Database]), CredentialModule],
  controllers: [CoolifyController],
  providers: [CoolifyProvider, CoolifyService],
  exports: [CoolifyService, CoolifyProvider],
})
export class CoolifyModule {}
