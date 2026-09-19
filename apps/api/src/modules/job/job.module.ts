import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { Resource } from '../resource/entities/resource.entity';
import { Server } from '../server/entities/server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Resource, Server])],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
