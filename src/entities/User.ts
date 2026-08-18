import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from './Project';
import { Task } from './Task';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  // bcrypt hash only — never plaintext, never returned in a response.
  // select: false means this column is excluded from normal queries
  // unless explicitly requested — an extra guard against accidental leaks.
  @Column({ type: 'text', select: false })
  password!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Project, (project) => project.owner)
  projects!: Project[];

  @OneToMany(() => Task, (task) => task.assignee)
  tasks!: Task[];
}
