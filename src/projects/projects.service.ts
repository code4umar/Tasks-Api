import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/Project';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
  ) {}

  // Used by TasksService to turn a bad projectId into a 404 instead of
  // letting a foreign-key violation surface as an unhandled 500.
  async findByIdOrFail(id: number): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }
}
