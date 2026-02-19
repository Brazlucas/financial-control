import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as ofx from 'ofx-js';
import * as stringSimilarity from 'string-similarity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';
import { CategoryRuleService } from '../category-rule/category-rule.service';
import { CategoryRule } from '../category-rule/entities/category-rule.entity';

@Injectable()
export class OfxService {
  private readonly logger = new Logger(OfxService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private categoryRuleService: CategoryRuleService,
  ) {}

  async processOfxFile(filePath: string) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = await ofx.parse(fileContent);

      const transactions =
        data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
      
      const transactionList = Array.isArray(transactions)
        ? transactions
        : [transactions];

      let processedCount = 0;
      let duplicateCount = 0;

      const user = await this.userRepository.findOne({ where: { isAdmin: true } });
      if (!user) {
        throw new Error('Default admin user not found for OFX import');
      }

      // Load Rules
      const rules = await this.categoryRuleService.findAll();

      for (const t of transactionList) {
        const fitid = t.FITID;
        const amount = parseFloat(t.TRNAMT);
        const description = (t.MEMO || t.NAME || 'Sem descrição').trim();
        const dateRaw = t.DTPOSTED;
        
        // Parse date
        const year = parseInt(dateRaw.substring(0, 4));
        const month = parseInt(dateRaw.substring(4, 6)) - 1;
        const day = parseInt(dateRaw.substring(6, 8));
        const hour = parseInt(dateRaw.substring(8, 10));
        const minute = parseInt(dateRaw.substring(10, 12));
        const second = parseInt(dateRaw.substring(12, 14));
        const date = new Date(year, month, day, hour, minute, second);

        // Deduplication Check
        const existing = await this.transactionRepository.findOne({
          where: { fitid },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        // Smart Categorization (Dynamic Rules)
        const categoryName = this.classifyTransaction(description, rules);
        let category = await this.categoryRepository.findOne({ where: { name: categoryName } });

        if (!category) {
          category = this.categoryRepository.create({
            name: categoryName,
            type: amount < 0 ? 'EXIT' : 'ENTRY',
          });
          await this.categoryRepository.save(category);
        }

        const newTransaction = this.transactionRepository.create({
          fitid,
          value: amount,
          description,
          date,
          type: amount < 0 ? 'EXIT' : 'ENTRY',
          user,
          category,
          memo: t.MEMO,
          refnum: t.REFNUM,
        });

        await this.transactionRepository.save(newTransaction);
        processedCount++;
      }

      fs.unlinkSync(filePath);
      await (this.cacheManager as any).clear();

      return {
        success: true,
        processed: processedCount,
        duplicates: duplicateCount,
        total: transactionList.length,
        rulesActive: rules?.length || 0
      };
    } catch (error) {
      this.logger.error('Error processing OFX', error);
      throw error;
    }
  }

  private classifyTransaction(description: string, rules: CategoryRule[]): string {
    const upperDesc = description.toUpperCase();
    
    // 1. Dynamic Rules Match
    for (const rule of rules) {
        const keyword = rule.keyword.toUpperCase();
        let matched = false;

        switch (rule.matchType) {
            case 'EXACT':
                matched = upperDesc === keyword;
                break;
            case 'STARTS_WITH':
                matched = upperDesc.startsWith(keyword);
                break;
            case 'CONTAINS':
            default:
                matched = upperDesc.includes(keyword);
                break;
        }

        if (matched) {
            return rule.category.name;
        }
    }

    // 2. Fallback: If no rule matches, return 'A Revisar'
    // We removed the hardcoded KNOWLEDGE_BASE and stringSimilarity for simplicity and to enforce rule usage.
    // If the user wants fuzzy matching, they should add rules that cover the terms.
    // OR we could implement a database-based fuzzy match later if needed.
    
    return 'A Revisar';
  }
}
