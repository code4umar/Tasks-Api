import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Task } from './Task';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  name!: string;

  @ManyToMany(() => Task, (task) => task.tags)
  tasks!: Task[];
}
