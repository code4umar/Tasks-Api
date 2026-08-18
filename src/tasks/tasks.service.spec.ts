import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from '../tasks/tasks.service';
import { Task } from '../entities/Task';
import { Tag } from '../entities/Tag';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

describe('TasksService', () => {
  let service: TasksService;

  // Mocks — no real database involved. This is possible only because
  // the repository and the other services are injected, never constructed
  // directly inside TasksService.
  const mockTasksRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((task) => Promise.resolve({ id: 1, ...task })),
  };
  const mockTagsRepo = {
    find: jest.fn(() => Promise.resolve([])),
  };
  const mockProjectsService = {
    findByIdOrFail: jest.fn(() => Promise.resolve({ id: 1, name: 'Test Project' })),
  };
  const mockUsersService = {
    findByIdOrFail: jest.fn(() => Promise.resolve({ id: 2, name: 'Test User' })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTasksRepo },
        { provide: getRepositoryToken(Tag), useValue: mockTagsRepo },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  it('creates a task, resolving project and assignee via their services', async () => {
    const dto = {
      title: 'Write tests',
      priority: 3,
      projectId: 1,
      assigneeId: 2,
    };

    const result = await service.create(dto as any);

    expect(mockProjectsService.findByIdOrFail).toHaveBeenCalledWith(1);
    expect(mockUsersService.findByIdOrFail).toHaveBeenCalledWith(2);
    expect(mockTasksRepo.create).toHaveBeenCalled();
    expect(mockTasksRepo.save).toHaveBeenCalled();
    expect(result.title).toBe('Write tests');
  });

  it('creates a task without an assignee when assigneeId is omitted', async () => {
    const dto = { title: 'No assignee task', priority: 1, projectId: 1 };

    await service.create(dto as any);

    expect(mockUsersService.findByIdOrFail).not.toHaveBeenCalled();
  });
});
