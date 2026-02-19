import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

export type MatchType = 'CONTAINS' | 'EXACT' | 'STARTS_WITH';

@Entity()
export class CategoryRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  keyword: string;

  @Column({
    type: 'simple-enum',
    enum: ['CONTAINS', 'EXACT', 'STARTS_WITH'],
    default: 'CONTAINS'
  })
  matchType: MatchType;

  @Column({ default: 10 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: number;
}
