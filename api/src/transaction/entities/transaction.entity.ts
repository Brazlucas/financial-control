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

  // OFX Fields
  @Column({ unique: true, nullable: true }) // Nullable for manual transactions
  fitid: string;

  @Column({ nullable: true })
  memo: string;

  @Column({ nullable: true })
  refnum: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.transactions, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Category, (category) => category.transactions, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: number;
}
