import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryRuleDto } from './create-category-rule.dto';

export class UpdateCategoryRuleDto extends PartialType(CreateCategoryRuleDto) {}
