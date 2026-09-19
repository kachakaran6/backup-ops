import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { Database } from '../database/entities/database.entity';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';
import { CredentialModule } from '../credential/credential.module';
import { CoolifyModule } from '../coolify/coolify.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Database]),
    CredentialModule,
    CoolifyModule,
  ],
  controllers: [ServerController],
  providers: [ServerService],
  exports: [ServerService],
})
export class ServerModule {}
