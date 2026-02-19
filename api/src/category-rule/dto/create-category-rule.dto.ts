export class CreateCategoryRuleDto {
  keyword: string;
  categoryId: number;
  matchType?: 'CONTAINS' | 'EXACT' | 'STARTS_WITH';
  priority?: number;
}
