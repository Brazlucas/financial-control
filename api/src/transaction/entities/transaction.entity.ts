import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';

export type TransactionType = 'ENTRY' | 'EXIT';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column()
  type: TransactionType;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.transactions, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category, (category) => category.transactions, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
