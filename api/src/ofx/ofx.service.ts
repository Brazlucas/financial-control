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

@Injectable()
export class OfxService {
  private readonly logger = new Logger(OfxService.name);

  // Knowledge Base: [Merchant Name, Category]
  // The more examples, the better the fuzzy matching.
  private readonly KNOWLEDGE_BASE = [
    // Alimentação
    { name: 'ATACADAO', category: 'Alimentação' },
    { name: 'SONDA SUPERMERCADOS', category: 'Alimentação' },
    { name: 'GIGA ATACADO', category: 'Alimentação' },
    { name: 'PAES E DOCES', category: 'Alimentação' },
    { name: 'MERCANTIL', category: 'Alimentação' },
    { name: 'TRIMAIS', category: 'Alimentação' },
    { name: 'COMERCIAL ESPERANCA', category: 'Alimentação' },
    { name: 'SUKIYA', category: 'Alimentação' },
    { name: 'BURGER KING', category: 'Alimentação' },
    { name: 'MC DONALDS', category: 'Alimentação' },
    { name: 'IFOOD', category: 'Alimentação' },
    { name: 'PADARIA', category: 'Alimentação' },
    { name: 'AÇOUGUE', category: 'Alimentação' },
    { name: 'RESTAURANTE', category: 'Alimentação' },
    { name: 'TAPIOCA', category: 'Alimentação' },
    { name: 'EMPÓRIO', category: 'Alimentação' },
    { name: 'PIZZA', category: 'Alimentação' },
    { name: 'SUPERMERCADOS', category: 'Alimentação' },
    { name: 'SUPERMERCADO', category: 'Alimentação' },
    { name: 'BERGAMINI', category: 'Alimentação' },
    { name: 'RESTAURA', category: 'Alimentação' },
    { name: 'STEAK', category: 'Alimentação' },
    { name: 'CONVENIENCIAS', category: 'Alimentação' },

    // Transporte
    { name: 'POSTO SHELL', category: 'Transporte' },
    { name: 'POSTO IPIRANGA', category: 'Transporte' },
    { name: 'UBER', category: 'Transporte' },
    { name: '99APP', category: 'Transporte' },
    { name: 'SEM PARAR', category: 'Transporte' },
    { name: 'ESTACIONAMENTO', category: 'Transporte' },
    { name: 'AUTO POSTO', category: 'Transporte' },
    { name: 'PEDAGIO', category: 'Transporte' },

    // Farmácia
    { name: 'DROGASIL', category: 'Farmácia' },
    { name: 'ULTRAFARMA', category: 'Farmácia' },
    { name: 'DROGARIA SAO PAULO', category: 'Farmácia' },
    { name: 'FARMACIA', category: 'Farmácia' },
    { name: 'PROMOFARMA', category: 'Farmácia' },

    // Serviços
    { name: 'SPOTIFY', category: 'Serviços' },
    { name: 'NETFLIX', category: 'Serviços' },
    { name: 'AMAZON PRIME', category: 'Serviços' },
    { name: 'GOOGLE STORAGE', category: 'Serviços' },
    { name: 'CLARO', category: 'Serviços' },
    { name: 'VIVO', category: 'Serviços' },
    { name: 'TIM', category: 'Serviços' },
    { name: 'ELETROPAULO', category: 'Serviços' },
    { name: 'SABESP', category: 'Serviços' },

    // Transferências
    { name: 'PIX TRANSFERENCIA', category: 'Transferências' },
    { name: 'TRANSF ENVIADA PIX', category: 'Transferências' },
    { name: 'TRANSF ENVIADA', category: 'Transferências' },
    { name: 'TED', category: 'Transferências' },
    { name: 'DOC', category: 'Transferências' },

    // Lazer
    { name: 'CINEMARK', category: 'Lazer' },
    { name: 'HOTZONE', category: 'Lazer' },
    { name: 'INGRESSO.COM', category: 'Lazer' },
    { name: 'PRAIA GRANDE', category: 'Lazer' },
    { name: 'PLEIADES', category: 'Lazer' },
    { name: 'GOLDEN TOWER HOTEIS', category: 'Lazer' },
    { name: 'ADEGA', category: 'Lazer' }, // User explicit request
    { name: 'MUSIC', category: 'Lazer' }, // Hobbies -> Lazer
    { name: 'STONES', category: 'Lazer' },
    { name: 'BAR', category: 'Lazer' },
    { name: 'BARBEARIA', category: 'Lazer' },
    { name: 'PARIS SEIS', category: 'Lazer' },
    { name: 'BLACKSHEEPBAR', category: 'Lazer' },
    { name: 'ROCK', category: 'Lazer' },
    { name: 'CASARIA', category: 'Lazer' },
    { name: 'SKATEPARK', category: 'Lazer' },
    { name: 'BARIO', category: 'Lazer' },
    { name: 'PIZZARIA', category: 'Lazer' },
    { name: 'SYMPLA', category: 'Lazer' },

    { name: 'GRPQA', category: 'Moradia' },

    // Pets
    { name: 'AVICULTURA', category: 'Pets' },
    { name: 'PETZ', category: 'Pets' },

    // Compras / Variedades
    { name: 'CASA E VIDA', category: 'Compras' },
    { name: 'DAISO', category: 'Compras' },
    { name: 'TAKEI', category: 'Compras' },
    { name: 'PAPELARIA', category: 'Compras' },
    { name: 'SHOP', category: 'Compras' },
    { name: 'LOJAS', category: 'Compras' },
    { name: 'LOJAS AMERICANAS', category: 'Alimentação' }, 
    { name: 'FASHION', category: 'Compras' }, 
    { name: 'LAZER', category: 'Compras' },

    // Educação
    { name: 'CESUMAR', category: 'Educação' },

    // Expand Alimentação
    { name: 'LHM CHOCOLATES', category: 'Alimentação' },
    { name: 'ASSAI', category: 'Alimentação' },
    { name: 'BECODOACAI', category: 'Alimentação' },
    { name: 'SONDA', category: 'Alimentação' },
    { name: 'ANTA NIO LOPES', category: 'Alimentação' },
    { name: 'CARREFOUR', category: 'Alimentação' },
    { name: 'OXXO', category: 'Alimentação' },
    { name: 'MAKIBELLA', category: 'Alimentação' },
    { name: 'IMPORIO LOPES', category: 'Alimentação' },
    { name: 'BLACK ROCK BURGER', category: 'Alimentação' },
    { name: 'LANCHONETE', category: 'Alimentação' },
    { name: 'FAZEND', category: 'Alimentação' },
    { name: 'BBQ', category: 'Alimentação' },
    { name: '99 FOOD', category: 'Alimentação' },
    { name: 'SORVETES', category: 'Alimentação' },
    { name: 'CACAU SHOW', category: 'Alimentação' },
    { name: 'PASTEL', category: 'Alimentação' },
    { name: 'GIOVANNI', category: 'Alimentação' },
    { name: 'CHURRAS', category: 'Alimentação' },
    { name: 'BATATA', category: 'Alimentação' },
    { name: 'BOI', category: 'Alimentação' },
    { name: 'LOPES', category: 'Alimentação' },
    { name: 'CAFE', category: 'Alimentação' },
    { name: 'PANNI', category: 'Lazer' },
    { name: 'CONFEITARIA', category: 'Alimentação' },

    // Expand Transporte / Auto
    { name: 'CAIXA ECONOMICA', category: 'Serviços' }, // Fees/Bank
    { name: 'ESTAC', category: 'Transporte' },
    { name: 'TERMINAL TUCUVI', category: 'Transporte' },
    { name: 'MOTOPECA', category: 'Transporte' },
    { name: 'PALMI CAR', category: 'Transporte' },
    { name: 'TUCURUVI PARKING', category: 'Transporte' },
    { name: 'PARK', category: 'Transporte' },
    { name: 'POSTO', category: 'Transporte' },
    { name: 'PIN MOTOPECAS', category: 'Transporte' },
    
    { name: 'ADIANTAMENTO', category: 'Adiantamento'},
    { name: 'COMPLEMENTO SALARIO', category: 'Salário'},
    { name: 'REMUNERACAO', category: 'Salário'},

    { name: 'FIT', category: 'Saúde'},
    { name: 'SHAPE', category: 'Saúde'},

    // AI / Tech Services
    { name: 'GPT', category: 'Serviços' },
    { name: 'OPENAI', category: 'Serviços' },

    // Internal Transfers (Self)
    { name: 'LUCAS MATHEUS MOREIRA BRAZ', category: 'Transferência Interna' },
  ];

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

        // Smart Categorization (Fuzzy)
        const categoryName = this.classifyTransaction(description);
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
      };
    } catch (error) {
      this.logger.error('Error processing OFX', error);
      throw error;
    }
  }

  private classifyTransaction(description: string): string {
    const upperDesc = description.toUpperCase();
    
    // 1. Exact/Keyword Match (Priority)
    // Verify content explicitly first to avoid bad fuzzy matches 
    // (e.g. "POSTO SAO PAULO" matching "DROGARIA SAO PAULO" due to "SAO PAULO")
    for (const entry of this.KNOWLEDGE_BASE) {
        if (upperDesc.includes(entry.name)) {
            return entry.category;
        }
    }

    // 2. Fuzzy Match (Fallback for typos)
    const knowledgeKeys = this.KNOWLEDGE_BASE.map(k => k.name);
    const matches = stringSimilarity.findBestMatch(upperDesc, knowledgeKeys);
    const bestMatch = matches.bestMatch;

    // Increased threshold to 0.7 to avoid false positives with common words
    if (bestMatch.rating > 0.7) { 
        const matchedEntry = this.KNOWLEDGE_BASE.find(k => k.name === bestMatch.target);
        if (matchedEntry) {
            return matchedEntry.category;
        }
    }

    return 'A Revisar';
  }
}
