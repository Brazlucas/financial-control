import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { runSeed } from './seed';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { CategoryRule } from '../../category-rule/entities/category-rule.entity';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do DataSource
const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Category, Transaction, CategoryRule],
  synchronize: true, // Auto-create tables for seed
});

async function bootstrap() {
  console.log('🔌 Conectando ao banco de dados...\n');

  try {
    // Conectar ao banco
    await AppDataSource.initialize();
    console.log('✅ Conectado ao PostgreSQL!\n');

    // Executar seed
    await runSeed(AppDataSource);

    // Fechar conexão
    await AppDataSource.destroy();
    console.log('🔌 Conexão fechada.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

// Executar
bootstrap();

