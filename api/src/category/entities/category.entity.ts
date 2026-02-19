import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Transaction } from '../../transaction/entities/transaction.entity';

export type CategoryType = 'ENTRY' | 'EXIT';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: CategoryType;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
