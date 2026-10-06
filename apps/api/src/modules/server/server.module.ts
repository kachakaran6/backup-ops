import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { Database } from '../database/entities/database.entity';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';
import { SshProviderService } from './ssh-provider.service';
import { CredentialModule } from '../credential/credential.module';
import { CoolifyModule } from '../coolify/coolify.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Database]),
    CredentialModule,
    CoolifyModule,
  ],
  controllers: [ServerController],
  providers: [ServerService, SshProviderService],
  exports: [ServerService, SshProviderService],
})
export class ServerModule {}

