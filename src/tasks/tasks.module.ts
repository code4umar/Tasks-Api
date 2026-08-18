import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/Task';
import { Tag } from '../entities/Tag';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Tag]),
    ProjectsModule,
    UsersModule,
    AuthModule, // needed so JwtAuthGuard/PassportModule are available here
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
