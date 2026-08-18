import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { TaskStatus } from '../../entities/Task';

export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus = TaskStatus.TODO;

  @IsInt()
  @Min(1)
  @Max(5)
  priority!: number;

  @IsInt()
  projectId!: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
