import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryRule } from './entities/category-rule.entity';
import { CreateCategoryRuleDto } from './dto/create-category-rule.dto';
import { UpdateCategoryRuleDto } from './dto/update-category-rule.dto';

@Injectable()
export class CategoryRuleService {
  constructor(
    @InjectRepository(CategoryRule)
    private readonly ruleRepo: Repository<CategoryRule>,
  ) {}

  create(dto: CreateCategoryRuleDto) {
    const rule = this.ruleRepo.create(dto);
    return this.ruleRepo.save(rule);
  }

  findAll() {
    return this.ruleRepo.find({
      relations: ['category'],
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!rule) throw new NotFoundException(`Rule #${id} not found`);
    return rule;
  }

  async update(id: number, dto: UpdateCategoryRuleDto) {
    const rule = await this.findOne(id);
    return this.ruleRepo.save({ ...rule, ...dto });
  }

  async remove(id: number) {
    const rule = await this.findOne(id);
    return this.ruleRepo.remove(rule);
  }
}
