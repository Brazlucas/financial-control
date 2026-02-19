import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository, UpdateResult, DeleteResult, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

const mockTransactionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  store: {},
  // Add 'clear' as it is used in the service (casted to any)
  clear: jest.fn(),
};

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('TransactionService', () => {
  let service: TransactionService;
  let repository: MockRepository<Transaction>;
  let cacheManager: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useFactory: mockTransactionRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    repository = module.get(getRepositoryToken(Transaction));
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 1;
    const createDto: CreateTransactionDto = {
      description: 'Test Transaction',
      value: 100,
      type: 'ENTRY',
      categoryId: 1,
    };

    it('should create a transaction successfully', async () => {
      const date = new Date();
      const savedTransaction = { 
        id: 1, 
        ...createDto, 
        user: { id: userId }, 
        category: { id: 1 },
        date 
      };
      const foundTransaction = { 
        ...savedTransaction, 
        category: { id: 1, name: 'Test Category' } 
      };

      repository.create!.mockReturnValue(savedTransaction);
      repository.save!.mockResolvedValue(savedTransaction);
      repository.findOne!.mockResolvedValue(foundTransaction);

      const result = await service.create(createDto, userId);

      expect(repository.create).toHaveBeenCalledWith({
        description: createDto.description,
        value: createDto.value,
        type: createDto.type,
        user: { id: userId },
        category: { id: createDto.categoryId },
      });
      expect(repository.save).toHaveBeenCalledWith(savedTransaction);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual({
        id: foundTransaction.id,
        description: foundTransaction.description,
        value: foundTransaction.value,
        type: foundTransaction.type,
        date: foundTransaction.date,
        userId,
        category: {
          id: foundTransaction.category.id,
          name: foundTransaction.category.name,
        },
      });
    });

    it('should throw NotFoundException if userId is missing', async () => {
      await expect(service.create(createDto, 0)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if transaction check fails after save', async () => {
      const savedTransaction = { 
        id: 1, 
        ...createDto, 
        user: { id: userId }, 
        category: { id: 1 },
        date: new Date()
      };
      
      repository.create!.mockReturnValue(savedTransaction);
      repository.save!.mockResolvedValue(savedTransaction);
      repository.findOne!.mockResolvedValue(null); // Fail here

      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const userId = 1;

    it('should return paginated transactions', async () => {
      const mockTransactions = [
        { 
            id: 1, 
            description: 'T1', 
            user: { id: userId }, 
            category: { id: 1, name: 'C1' },
            date: new Date() 
        }
      ];
      
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(mockTransactions),
      };

      repository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(userId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('transaction.user.id = :userId', { userId });
    });

    it('should apply date filters (month/year)', async () => {
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
          getMany: jest.fn().mockResolvedValue([]),
        };
  
        repository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);
  
        await service.findAll(userId, 10, 2023);
  
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'transaction.date BETWEEN :startDate AND :endDate', 
          expect.anything()
        );
    });
  });

  describe('findOne', () => {
    it('should return a transaction if found', async () => {
      const mockTransaction = { 
          id: 1, 
          description: 'T1', 
          user: { id: 1 }, 
          category: { id: 1, name: 'C1' } 
      };
      repository.findOne!.mockResolvedValue(mockTransaction);

      const result = await service.findOne(1, 1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne!.mockResolvedValue(null);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and clear cache', async () => {
      const updateDto: UpdateTransactionDto = { description: 'Updated' };
      const mockTransaction = { id: 1, user: { id: 1 } }; // Minimal valid
      
      // Mock findOne for the check inside update
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction as any);
      
      repository.update!.mockResolvedValue({ affected: 1 } as UpdateResult);

      await service.update(1, updateDto, 1);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove and clear cache', async () => {
      const mockTransaction = { id: 1, user: { id: 1 } };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction as any);
      
      repository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await service.remove(1, 1);

      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('getBalanceByUser', () => {
    it('should calculate balance correctly', async () => {
      const transactions = [
        { type: 'ENTRY', value: 100 },
        { type: 'EXIT', value: 50 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      };
      repository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);

      const result = await service.getBalanceByUser(1);

      expect(result.income).toBe(100);
      expect(result.expense).toBe(50);
      expect(result.balance).toBe(50);
    });

    it('should handle month/year filtering in balance', async () => {
        const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };
        repository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);

        await service.getBalanceByUser(1, 10, 2023);
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'transaction.date BETWEEN :start AND :end',
            expect.anything()
        );
    });
  });

  describe('getChartData', () => {
    const userId = 1;

    it('should return cached data if available', async () => {
      const cachedData = { foo: 'bar' };
      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getChartData(userId);
      expect(result).toEqual(cachedData);
      expect(repository.find).not.toHaveBeenCalled();
    });

    describe('calculations', () => {
        const mockTransactions = [
            { 
                id: 1, 
                date: new Date('2023-10-01T10:00:00Z'), 
                type: 'ENTRY', 
                value: 1000, 
                description: 'Salary', 
                category: { name: 'Work' } 
            },
            { 
                id: 2, 
                date: new Date('2023-10-05T12:00:00Z'), 
                type: 'EXIT', 
                value: 200, 
                description: 'Food', 
                category: { name: 'Alimentação' } 
            },
            { 
                id: 3, 
                date: new Date('2023-10-06T12:00:00Z'), 
                type: 'EXIT', 
                value: 50, 
                description: 'Transfer', 
                category: { name: 'Transferências internas' } // Should be filtered out
            },
            {
                id: 4,
                date: new Date('2023-10-10T12:00:00Z'),
                type: 'EXIT',
                value: 100,
                description: 'Food', // Recurring merchant
                category: { name: 'Alimentação' }
            },
            {
                id: 5,
                date: new Date('2023-10-15T12:00:00Z'),
                type: 'EXIT',
                value: 300,
                description: 'Rent',
                category: { name: 'Moradia' }
            }
        ];

        beforeEach(() => {
            cacheManager.get.mockResolvedValue(null);
            repository.find!.mockResolvedValue(mockTransactions);
            
            // Default projection mock
            const mockPreviousTransactions = [
                {
                    id: 99,
                    value: 450, // 450 / 3 months = 150 avg
                    type: 'EXIT',
                    category: { name: 'Alimentação' }
                }
            ];
            
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockPreviousTransactions),
            };
            repository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);
        });

        it('should correctly calculate summary KPIs excluding internal transfers', async () => {
            // Target specific month to match mock dates (October 2023)
            const result = await service.getChartData(userId, 10, 2023);

            // Total Income: 1000
            // Total Expense: 200 (Food) + 100 (Food) + 300 (Rent) = 600. (Transfer 50 is excluded)
            // Balance: 1000 - 600 = 400
            expect(result.summary.totalIncome).toBe(1000);
            expect(result.summary.totalExpense).toBe(600);
            expect(result.summary.balance).toBe(400);
            expect(result.summary.transactionCount).toBe(4); // 5 total - 1 transfer
        });

        it('should identify the biggest expense', async () => {
            const result = await service.getChartData(userId, 10, 2023);
            
            expect(result.summary.biggestExpense).toEqual({
                description: 'Rent',
                value: 300,
                date: expect.any(Date)
            });
        });

        it('should group category breakdown correctly', async () => {
            const result = await service.getChartData(userId, 10, 2023);

            // Alimentação: 200 + 100 = 300
            // Moradia: 300
            const alimentacao = result.categories.find((c: any) => c.name === 'Alimentação');
            const moradia = result.categories.find((c: any) => c.name === 'Moradia');

            expect(alimentacao.value).toBe(300);
            expect(moradia.value).toBe(300);
            expect(result.categories.length).toBe(2);
        });

        it('should group top merchants correctly', async () => {
            const result = await service.getChartData(userId, 10, 2023);

            // Food: 200 + 100 = 300
            // Rent: 300
            // Salary is ENTRY, so not in top merchants (usually expense focused)
            const food = result.topMerchants.find((m: any) => m.name === 'Food');
            const rent = result.topMerchants.find((m: any) => m.name === 'Rent');

            expect(food.value).toBe(300);
            expect(rent.value).toBe(300);
        });

        it('should calculate projection status correctly', async () => {
            const result = await service.getChartData(userId, 10, 2023);
            
            // Alimentação:
            // Current Spend: 300
            // Previous Mock Avg: 150 (450 total / 3)
            // Expect Status: warning (300 > 150)
            
            const alimentacaoProj = result.projection.find((p: any) => p.name === 'Alimentação');
            
            expect(alimentacaoProj).toBeDefined();
            expect(alimentacaoProj.current).toBe(300);
            expect(alimentacaoProj.average).toBe(150);
            expect(alimentacaoProj.status).toBe('warning');
        });
    });
  });
});
