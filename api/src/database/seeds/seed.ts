import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';

export async function runSeed(dataSource: DataSource) {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Repositórios
  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const transactionRepo = dataSource.getRepository(Transaction);

  try {
    // ========================================
    // 1. CRIAR USUÁRIO PADRÃO
    // ========================================
    console.log('👤 Criando usuário padrão...');
    
    // Verificar se usuário já existe
    let user = await userRepo.findOne({
      where: { email: 'lukkascomics@gmail.com' },
    });

    let user2 = await userRepo.findOne({
      where: { email: 'martinsgabrielli.ri@outlook.com' },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('97322607l', 10);
      user = userRepo.create({
        name: 'Lukkas',
        email: 'lukkascomics@gmail.com',
        password: hashedPassword,
        isAdmin: true,
      });
      await userRepo.save(user);
      console.log('   ✅ Usuário criado: lukkascomics@gmail.com');
    } else {
      console.log('   ℹ️  Usuário já existe: lukkascomics@gmail.com');
    }

    if (!user2) {
      const hashedPassword = await bcrypt.hash('97322607l', 10);
      user2 = userRepo.create({
        name: 'Gabrielli',
        email: 'martinsgabrielli.ri@outlook.com',
        password: hashedPassword,
        isAdmin: false,
      });
      await userRepo.save(user2);
      console.log('   ✅ Usuário criado: martinsgabrielli.ri@outlook.com');
    } else {
      console.log('   ℹ️  Usuário já existe: martinsgabrielli.ri@outlook.com');
    }

    // ========================================
    // 2. CRIAR CATEGORIAS PADRÃO
    // ========================================
    console.log('\n📂 Criando categorias padrão...');

    const categoriesData = [
      // Categorias de ENTRADA
      { name: 'Salário', type: 'ENTRY' as const },
      { name: 'Freelance', type: 'ENTRY' as const },
      { name: 'Investimentos', type: 'ENTRY' as const },
      { name: 'Vendas', type: 'ENTRY' as const },
      { name: 'Bonificação', type: 'ENTRY' as const },
      { name: 'Outros Ganhos', type: 'ENTRY' as const },
      { name: 'ADIANTAMENTO', type: 'ENTRY' as const }, // User requested

      // Categorias de SAÍDA
      { name: 'Alimentação', type: 'EXIT' as const },
      { name: 'Transporte', type: 'EXIT' as const },
      { name: 'Moradia', type: 'EXIT' as const },
      { name: 'Saúde', type: 'EXIT' as const },
      { name: 'Educação', type: 'EXIT' as const },
      { name: 'Lazer', type: 'EXIT' as const },
      { name: 'Compras', type: 'EXIT' as const },
      { name: 'Contas', type: 'EXIT' as const },
      { name: 'Investimentos', type: 'EXIT' as const },
      { name: 'Outros Gastos', type: 'EXIT' as const },
    ];

    const categories: Category[] = [];
    for (const catData of categoriesData) {
      let category = await categoryRepo.findOne({
        where: { name: catData.name, type: catData.type },
      });

      if (!category) {
        category = categoryRepo.create(catData);
        await categoryRepo.save(category);
        console.log(`   ✅ Categoria criada: ${catData.name} (${catData.type})`);
      } else {
        console.log(`   ℹ️  Categoria já existe: ${catData.name}`);
      }
      categories.push(category);
    }

    // ========================================
    // 3. CRIAR TRANSAÇÕES DE EXEMPLO
    // ========================================
    console.log('\n💰 Criando transações de exemplo...');

    // Buscar categorias criadas
    const salarioCategory = categories.find(c => c.name === 'Salário');
    const alimentacaoCategory = categories.find(c => c.name === 'Alimentação');
    const transporteCategory = categories.find(c => c.name === 'Transporte');
    const lazerCategory = categories.find(c => c.name === 'Lazer');
    const freelanceCategory = categories.find(c => c.name === 'Freelance');
    const contasCategory = categories.find(c => c.name === 'Contas');

    const transactionsData = [
      // Entradas
      {
        description: 'Salário do mês',
        value: 5000.00,
        type: 'ENTRY' as const,
        date: new Date('2024-10-01'),
        user,
        category: salarioCategory,
      },
      {
        description: 'Projeto freelance - Website',
        value: 1500.00,
        type: 'ENTRY' as const,
        date: new Date('2024-10-15'),
        user,
        category: freelanceCategory,
      },
      {
        description: 'Projeto freelance - Logo',
        value: 800.00,
        type: 'ENTRY' as const,
        date: new Date('2024-10-20'),
        user,
        category: freelanceCategory,
      },

      // Saídas
      {
        description: 'Mercado - Compras do mês',
        value: 650.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-05'),
        user,
        category: alimentacaoCategory,
      },
      {
        description: 'Restaurante - Almoço',
        value: 85.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-12'),
        user,
        category: alimentacaoCategory,
      },
      {
        description: 'Uber - Corridas da semana',
        value: 120.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-08'),
        user,
        category: transporteCategory,
      },
      {
        description: 'Gasolina',
        value: 250.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-10'),
        user,
        category: transporteCategory,
      },
      {
        description: 'Cinema - Ingressos',
        value: 90.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-14'),
        user,
        category: lazerCategory,
      },
      {
        description: 'Conta de luz',
        value: 180.00,
        type: 'EXIT' as const,
        date: new Date('2024-10-05'),
        user,
        category: contasCategory,
      },
      {
        description: 'Internet',
        value: 99.90,
        type: 'EXIT' as const,
        date: new Date('2024-10-05'),
        user,
        category: contasCategory,
      },
    ];

    /*
    for (const txData of transactionsData) {
      const exists = await transactionRepo.findOne({
        where: {
          description: txData.description,
          value: txData.value,
        },
      });

      if (!exists) {
        const transaction = transactionRepo.create(txData);
        await transactionRepo.save(transaction);
        console.log(
          `   ✅ Transação criada: ${txData.description} - R$ ${txData.value.toFixed(2)} (${txData.type})`
        );
      } else {
        console.log(`   ℹ️  Transação já existe: ${txData.description}`);
      }
    }
    */
    console.log('   ⚠️  Transações de exemplo ignoradas (Cleanup solicitado).');

    // ========================================
    // 4. RESUMO
    // ========================================
    console.log('\n📊 Resumo do Seed:');
    const totalUsers = await userRepo.count();
    const totalCategories = await categoryRepo.count();
    const totalTransactions = await transactionRepo.count();
    const totalEntries = await transactionRepo.count({
      where: { type: 'ENTRY' },
    });
    const totalExits = await transactionRepo.count({ where: { type: 'EXIT' } });

    console.log(`   👥 Usuários: ${totalUsers}`);
    console.log(`   📂 Categorias: ${totalCategories}`);
    console.log(`   💰 Transações: ${totalTransactions}`);
    console.log(`      └─ Entradas: ${totalEntries}`);
    console.log(`      └─ Saídas: ${totalExits}`);

    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('🔑 Credenciais de acesso:');
    console.log('   Email: lukkascomics@gmail.com');
    console.log('   Senha: 97322607l');
    console.log('   Admin: Sim\n');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  }
}

