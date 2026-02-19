import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryRuleService } from './category-rule.service';
import { CreateCategoryRuleDto } from './dto/create-category-rule.dto';
import { UpdateCategoryRuleDto } from './dto/update-category-rule.dto';

@Controller('category-rules')
export class CategoryRuleController {
  constructor(private readonly categoryRuleService: CategoryRuleService) {}

  @Post()
  create(@Body() dto: CreateCategoryRuleDto) {
    return this.categoryRuleService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoryRuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryRuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryRuleDto) {
    return this.categoryRuleService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryRuleService.remove(+id);
  }
}
