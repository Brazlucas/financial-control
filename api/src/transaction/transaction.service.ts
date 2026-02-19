import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult, Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/response-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateTransactionDto, userId: number): Promise<TransactionResponseDto> {
    if (!userId) {
      throw new NotFoundException('Usuário não encontrado');
    }
  
    const transaction = this.transactionRepo.create({
      description: dto.description,
      value: dto.value,
      type: dto.type,
      user: { id: userId },
      category: { id: dto.categoryId },
    });
  
    const saved = await this.transactionRepo.save(transaction);
    await (this.cacheManager as any).clear(); // Invalidate cache on change
  
    const result = await this.transactionRepo.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });
  
    if (!result) {
      throw new NotFoundException('Transação não encontrada após salvar');
    }
  
    return {
      id: result.id,
      description: result.description,
      value: result.value,
      type: result.type,
      date: result.date,
      userId,
      category: {
        id: result.category.id,
        name: result.category.name,
      },
    };
  }

  async findAll(
    userId: number, 
    month?: number, 
    year?: number, 
    limit = 10, 
    page = 1,
    sortBy = 'date',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    categoryId?: number,
    search?: string
  ): Promise<{ data: TransactionResponseDto[]; total: number; sum: number }> {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.user.id = :userId', { userId });

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      qb.andWhere('transaction.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      qb.andWhere('transaction.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (categoryId) {
        qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (search) {
      qb.andWhere(new Brackets(qb => {
        qb.where('LOWER(transaction.description) LIKE :search', { search: `%${search.toLowerCase()}%` })
          .orWhere('LOWER(transaction.memo) LIKE :search', { search: `%${search.toLowerCase()}%` });
      }));
    }

    // Clone qb to get sum before pagination
    const sumQb = qb.clone();
    const { sum } = await sumQb.select('SUM(transaction.value)', 'sum').getRawOne();

    const total = await qb.getCount();

    const transactions = await qb
      .orderBy(`transaction.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      value: t.value,
      type: t.type,
      date: t.date,
      userId,
      category: {
        id: t.category.id,
        name: t.category.name,
      },
    }));

    return { data, total, sum: Number(sum) || 0 };
  }

  async findOne(id: number, userId: number): Promise<TransactionResponseDto> { 
    const transaction = await this.transactionRepo.findOne({
      where: {
        id,
        user: { id: userId },
      },
      relations: ['category', 'user'],
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    return {
      id: transaction.id,
      description: transaction.description,
      value: transaction.value,
      type: transaction.type,
      date: transaction.date,
      userId: transaction.user.id,
      category: {
        id: transaction.category.id,
        name: transaction.category.name,
      },
    };
  }

  async update(id: number, dto: UpdateTransactionDto, userId: number): Promise<UpdateResult> {
    await this.findOne(id, userId);
    const result = await this.transactionRepo.update(id, dto);
    await (this.cacheManager as any).clear(); // Invalidate cache on change
    return result;
  }

  async remove(id: number, userId: number): Promise<DeleteResult> {
    await this.findOne(id, userId);
    const result = await this.transactionRepo.delete(id);
    await (this.cacheManager as any).clear(); // Invalidate cache on change
    return result;
  }

  async getBalanceByUser(userId: number, month?: number, year?: number, search?: string): Promise<{ income: number, expense: number, balance: number }> {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId });
  
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      qb.andWhere('transaction.date BETWEEN :start AND :end', { start, end });
    } else if (month && !year) {
      qb.andWhere("strftime('%m', transaction.date) = :month", { month: String(month).padStart(2, '0') });
    } else if (year && !month) {
      qb.andWhere("strftime('%Y', transaction.date) = :year", { year: String(year) });
    }

    if (search) {
      qb.andWhere(new Brackets(qb => {
        qb.where('LOWER(transaction.description) LIKE :search', { search: `%${search.toLowerCase()}%` })
          .orWhere('LOWER(transaction.memo) LIKE :search', { search: `%${search.toLowerCase()}%` });
      }));
    }
  
    const transactions = await qb.getMany();
  
    const balance = transactions.reduce(
      (acc, t) => {
        const value = parseFloat(t.value as any);
        if (t.type === 'ENTRY') acc.income += value;
        if (t.type === 'EXIT') acc.expense += value;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const round = (valor: number) => Math.round(valor * 100) / 100;
  
    return {
      income: round(balance.income),
      expense: round(balance.expense),
      balance: round(balance.income - balance.expense),
    };
  }

  async getChartData(userId: number, month?: number, year?: number, categoryId?: number, search?: string): Promise<any> {
    // Cache Key Strategy: dashboard_USERID_MONTH_YEAR_CATEGORY_SEARCH
    const cacheKey = `dashboard_v2_${userId}_${month || 'all'}_${year || 'all'}_${categoryId || 'all'}_${search || 'all'}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Use QueryBuilder for allTransactions to support flexible OR conditions for search
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    if (categoryId) {
        qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (search) {
      qb.andWhere(new Brackets(qb => {
        qb.where('LOWER(transaction.description) LIKE :search', { search: `%${search.toLowerCase()}%` })
          .orWhere('LOWER(transaction.memo) LIKE :search', { search: `%${search.toLowerCase()}%` });
      }));
    }

    const allTransactions = await qb.getMany();

    // Exclude 'Transferência Interna' and 'Transferências' from dashboard calculations
    const nonInternalTransactions = allTransactions.filter(t => 
      t.category?.name !== 'Transferências internas');
    const formatMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // --- 1. History Chart (Last 6 Months Trend) ---
    // We want a trend regardless of the specific month filter, 
    // unless the user wants to Zoom in? Usually history shows context.
    // Let's keep it as last 6 months for now.
    const historyMap = new Map<string, { income: number; expense: number }>();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        historyMap.set(formatMonth(d), { income: 0, expense: 0 });
    }

    nonInternalTransactions.forEach(t => {
       const tDate = new Date(t.date);
       const key = formatMonth(tDate);
       if (historyMap.has(key)) {
           const val = Number(t.value);
           const entry = historyMap.get(key);
           if (entry) {
               if (t.type === 'ENTRY') entry.income += val;
               else entry.expense += val;
           }
       }
    });

    const history = Array.from(historyMap.entries()).map(([date, values]) => ({
        date,
        ...values
    }));

    // --- Filter logic for Specific Analysis (Categories, Merchants, Summary) ---
    const filteredTransactions = nonInternalTransactions.filter(t => {
        const tDate = new Date(t.date);
        if (month && year) {
             return (tDate.getFullYear() === year && (tDate.getMonth() + 1) === month);
        } else if (month && !year) {
             return ((tDate.getMonth() + 1) === month);
        } else if (year && !month) {
             return (tDate.getFullYear() === year);
        } else {
            // If no date filter is provided (e.g. searching "Panni"), return ALL matching transactions
            return true;
        }
    });

    // --- 2. Category Breakdown (Pie Chart) ---
    const categoryMap = new Map<string, number>();
    const incomeCategoryMap = new Map<string, number>();

    filteredTransactions.forEach(t => {
        if (t.type === 'EXIT') {
            const catName = t.category?.name || 'Sem Categoria';
            const val = Math.abs(Number(t.value)); // Absolute value
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + val);
        } else if (t.type === 'ENTRY') {
            const catName = t.category?.name || 'Sem Categoria';
            const val = Math.abs(Number(t.value));
            incomeCategoryMap.set(catName, (incomeCategoryMap.get(catName) || 0) + val);
        }
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const incomeCategoryBreakdown = Array.from(incomeCategoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // --- 3. Top Merchants (Bar Chart) & Income Sources ---
    const merchantMap = new Map<string, number>();
    const incomeSourceMap = new Map<string, number>();

    filteredTransactions.forEach(t => {
        const description = t.description.trim();
        const val = Math.abs(Number(t.value));

        if (t.type === 'EXIT') {
             merchantMap.set(description, (merchantMap.get(description) || 0) + val);
        } else if (t.type === 'ENTRY') {
             incomeSourceMap.set(description, (incomeSourceMap.get(description) || 0) + val);
        }
    });

    const topMerchants = Array.from(merchantMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) 
        .slice(0, 10);

    const topIncomeSources = Array.from(incomeSourceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // --- 4. Summary Cards (KPIs) ---
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'ENTRY')
        .reduce((sum, t) => sum + Number(t.value), 0);
        
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'EXIT')
        .reduce((sum, t) => sum + Number(t.value), 0);
    
    const balance = totalIncome - totalExpense; // Net for the period

    // Daily Average (Expense)
    // Calculate days in period
    let daysInPeriod = 30;
    if (month && year) {
        daysInPeriod = new Date(year, month, 0).getDate();
    } else if (filteredTransactions.length > 0) {
        // Calculate dynamic range based on data
        const dates = filteredTransactions.map(t => new Date(t.date).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        // Add 1 day to include the full last day, or simply diff + 1
        const diffTime = Math.abs(maxDate - minDate);
        daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        // Ensure at least 1 day to avoid Infinity
        daysInPeriod = Math.max(1, daysInPeriod);
    }
    
    const dailyAverage = totalExpense / daysInPeriod;

    // Biggest Expense
    const biggestExpenseTransaction = filteredTransactions
        .filter(t => t.type === 'EXIT')
        .sort((a, b) => Math.abs(Number(b.value)) - Math.abs(Number(a.value)))[0];

    const summary = {
        totalIncome,
        totalExpense: Math.abs(totalExpense), // Ensure positive for display
        balance, // Period balance
        dailyAverage: Math.abs(dailyAverage), // Ensure positive
        biggestExpense: biggestExpenseTransaction ? {
            description: biggestExpenseTransaction.description,
            value: Math.abs(Number(biggestExpenseTransaction.value)),
            date: biggestExpenseTransaction.date
        } : null,
        transactionCount: filteredTransactions.length
    };

    // --- 5. Spending Projection (Last 3 Months Avg vs Current) ---
    // Average set: 3 months prior to target month.
    const avgStart = new Date(targetYear, targetMonth - 4, 1); // 3 months back from month start
    const avgEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59); // Last second of previous month

    const previousTransactions = await this.transactionRepo
       .createQueryBuilder('transaction')
       .leftJoinAndSelect('transaction.category', 'category')
       .where('transaction.userId = :userId', { userId })
       .andWhere('transaction.date BETWEEN :start AND :end', { start: avgStart, end: avgEnd })
       .andWhere('transaction.type = :type', { type: 'EXIT' })
       .getMany();

    const categorySumMap = new Map<string, number>();
    previousTransactions.forEach(t => {
        const catName = t.category?.name || 'Sem Categoria';
        categorySumMap.set(catName, (categorySumMap.get(catName) || 0) + Number(t.value));
    });

    const categoriesProjection = Array.from(categoryMap.keys()).map(catName => {
        const currentSpend = categoryMap.get(catName) || 0;
        const totalPrevious = categorySumMap.get(catName) || 0;
        const average = totalPrevious / 3; 
        
        // Simple Projection: (Current / DaysPassed) * TotalDays
        // But user asked for "If avg is 400, show projection". 
        // Let's return both: Average (Benchmark) and Current.
        
        return {
            name: catName,
            current: currentSpend,
            average: average,
            status: currentSpend > average ? 'warning' : 'good'
        };
    }).sort((a, b) => b.current - a.current).slice(0, 5); // Top 5 categories of current month

    const result = { 
        history, 
        categories: categoryBreakdown, 
        incomeCategories: incomeCategoryBreakdown,
        topMerchants,
        topIncomeSources,
        summary,
        projection: categoriesProjection
    };

    // Cache the result
    await (this.cacheManager as any).set(cacheKey, result);

    return result;
  }
}
