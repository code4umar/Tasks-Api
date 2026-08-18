import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/Task';
import { Tag } from '../entities/Tag';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

export interface TaskFilters {
  status?: string;
  projectId?: number;
  assigneeId?: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(Tag) private tagsRepo: Repository<Tag>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    // A bad projectId/assigneeId should be a 404, not a raw FK violation
    // (which would otherwise surface as an unhandled 500).
    const project = await this.projectsService.findByIdOrFail(dto.projectId);
    const assignee = dto.assigneeId
      ? await this.usersService.findByIdOrFail(dto.assigneeId)
      : null;
    const tags = dto.tagIds?.length
      ? await this.tagsRepo.find({ where: { id: In(dto.tagIds) } })
      : [];

    const task = this.tasksRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      priority: dto.priority,
      project,
      assignee,
      tags,
    });

    return this.tasksRepo.save(task);
  }

  async findAll(filters: TaskFilters): Promise<Task[]> {
    const qb = this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags');

    // Filters are optional and combinable — each is applied only if present.
    if (filters.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.projectId) {
      qb.andWhere('task.project = :projectId', { projectId: filters.projectId });
    }
    if (filters.assigneeId) {
      qb.andWhere('task.assignee = :assigneeId', { assigneeId: filters.assigneeId });
    }

    return qb.getMany();
  }

  async findOneOrFail(id: number): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: ['project', 'assignee', 'tags'],
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOneOrFail(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;

    if (dto.projectId !== undefined) {
      task.project = await this.projectsService.findByIdOrFail(dto.projectId);
    }
    if (dto.assigneeId !== undefined) {
      task.assignee = dto.assigneeId
        ? await this.usersService.findByIdOrFail(dto.assigneeId)
        : null;
    }
    if (dto.tagIds !== undefined) {
      task.tags = dto.tagIds.length
        ? await this.tagsRepo.find({ where: { id: In(dto.tagIds) } })
        : [];
    }

    return this.tasksRepo.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOneOrFail(id);
    await this.tasksRepo.remove(task);
  }
}
