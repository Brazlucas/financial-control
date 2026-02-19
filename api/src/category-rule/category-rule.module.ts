import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryRuleService } from './category-rule.service';
import { CategoryRuleController } from './category-rule.controller';
import { CategoryRule } from './entities/category-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryRule])],
  controllers: [CategoryRuleController],
  providers: [CategoryRuleService],
  exports: [CategoryRuleService], // Export so OfxService can use it
})
export class CategoryRuleModule {}
