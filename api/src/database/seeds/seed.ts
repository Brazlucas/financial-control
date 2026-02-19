import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { CategoryRule } from '../../category-rule/entities/category-rule.entity';

export async function runSeed(dataSource: DataSource) {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Repositórios
  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const transactionRepo = dataSource.getRepository(Transaction);
  const categoryRuleRepo = dataSource.getRepository(CategoryRule);

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
      { name: 'Salário', type: 'ENTRY' as const, isSystem: true },
      { name: 'Freelances', type: 'ENTRY' as const, isSystem: true },
      { name: 'Vendas', type: 'ENTRY' as const, isSystem: true },
      { name: 'Outros Ganhos', type: 'ENTRY' as const, isSystem: true },
      { name: 'Adiantamento', type: 'ENTRY' as const, isSystem: true }, // Updated case
      { name: 'Transferências internas', type: 'ENTRY' as const, isSystem: true },

      // Categorias de SAÍDA
      { name: 'Alimentação', type: 'EXIT' as const, isSystem: true },
      { name: 'Transporte', type: 'EXIT' as const, isSystem: true },
      { name: 'Moradia', type: 'EXIT' as const, isSystem: true },
      { name: 'Saúde', type: 'EXIT' as const, isSystem: true },
      { name: 'Educação', type: 'EXIT' as const, isSystem: true },
      { name: 'Lazer', type: 'EXIT' as const, isSystem: true },
      { name: 'Compras', type: 'EXIT' as const, isSystem: true },
      { name: 'Contas', type: 'EXIT' as const, isSystem: true },
      { name: 'Investimentos', type: 'EXIT' as const, isSystem: true },
      { name: 'Outros Gastos', type: 'EXIT' as const, isSystem: true },
      { name: 'Pets', type: 'EXIT' as const, isSystem: true },
      { name: 'Farmácia', type: 'EXIT' as const, isSystem: true },
      { name: 'Serviços', type: 'EXIT' as const, isSystem: true },
      { name: 'Transferências enviadas', type: 'EXIT' as const, isSystem: true },
      { name: 'A Revisar', type: 'EXIT' as const, isSystem: true },
    ];

    const categories: Category[] = [];
    
    for (const catData of categoriesData) {
      // 1. Buscar todas as categorias com mesmo nome (case-insensitive) e tipo
      const existingCategories = await categoryRepo
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name: catData.name })
        .andWhere('category.type = :type', { type: catData.type })
        .getMany();

      let targetCategory: Category;

      if (existingCategories.length === 0) {
        // Criar nova se não existir nenhuma
        targetCategory = categoryRepo.create(catData);
        await categoryRepo.save(targetCategory);
        console.log(`   ✅ Categoria criada: ${catData.name} (${catData.type})`);
      } else {
        // Se existirem duplicatas, escolher a "melhor" para manter (preferência para a que já é do sistema)
        const systemCat = existingCategories.find(c => c.isSystem);
        targetCategory = systemCat || existingCategories[0];

        // Atualizar a categoria mantida (garantir nome correto e isSystem = true)
        targetCategory.name = catData.name;
        targetCategory.isSystem = true;
        await categoryRepo.save(targetCategory);
        console.log(`   🔄 Categoria atualizada/mantida: ${catData.name}`);

        // Processar duplicatas (se houver mais de uma categoria encontrada)
        const duplicates = existingCategories.filter(c => c.id !== targetCategory.id);
        
        for (const duplicate of duplicates) {
          console.log(`      ⚠️ Duplicata encontrada: ${duplicate.name} (ID: ${duplicate.id}) -> Mesclando...`);
          
          // Mover transações da duplicata para a categoria principal
          await transactionRepo
            .createQueryBuilder()
            .update(Transaction)
            .set({ category: targetCategory })
            .where('categoryId = :dupId', { dupId: duplicate.id })
            .execute();
            
          // Excluir a categoria duplicada
          await categoryRepo.delete(duplicate.id);
          console.log(`      🗑️ Duplicata removida: ID ${duplicate.id}`);
        }
      }
      categories.push(targetCategory);
    }

    // ========================================
    // 3. SEED CATEGORY RULES (KNOWLEDGE BASE)
    // ========================================
    console.log('\n🧠 Seeding Category Rules...');

    const KNOWLEDGE_BASE = [
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

        // Transferências enviadas
        { name: 'PIX TRANSFERENCIA', category: 'Transferências enviadas' },
        // { name: 'PIX RECEBIDO', category: 'Outros Ganhos' },
        { name: 'PIX ESTORNADO', category: 'Outros Ganhos' },  
        { name: 'TRANSF ENVIADA PIX', category: 'Transferências enviadas' },
        { name: 'TRANSF ENVIADA', category: 'Transferências enviadas' },
        { name: 'TED', category: 'Transferências enviadas' },
        { name: 'DOC', category: 'Transferências enviadas' },

        // Lazer
        { name: 'CINEMARK', category: 'Lazer' },
        { name: 'HOTZONE', category: 'Lazer' },
        { name: 'INGRESSO.COM', category: 'Lazer' },
        { name: 'PRAIA GRANDE', category: 'Lazer' },
        { name: 'PLEIADES', category: 'Lazer' },
        { name: 'GOLDEN TOWER HOTEIS', category: 'Lazer' },
        { name: 'ADEGA', category: 'Lazer' },
        { name: 'MUSIC', category: 'Lazer' },
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
        { name: 'CAIXA ECONOMICA', category: 'Serviços' },
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
        { name: 'LUCAS MATHEUS MOREIRA BRAZ', category: 'Transferências internas' },
    ];

    for (const item of KNOWLEDGE_BASE) {
       // Find the target category
       const category = await categoryRepo.findOne({ where: { name: item.category } });
       
       if (category) {
           const existingRule = await categoryRuleRepo.findOne({ where: { keyword: item.name } });
           
           if (!existingRule) {
               const rule = categoryRuleRepo.create({
                   keyword: item.name,
                   category: category,
                   matchType: 'CONTAINS', // Default for now
                   priority: 10
               });
               await categoryRuleRepo.save(rule);
               console.log(`   ✅ Regra criada: "${item.name}" -> ${item.category}`);
           }
       } else {
           console.log(`   ⚠️ Categoria não encontrada para regra: ${item.category} (Keyword: ${item.name})`);
       }
    }

    // ========================================
    // 4. CRIAR TRANSAÇÕES DE EXEMPLO
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

