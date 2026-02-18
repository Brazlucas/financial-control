import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfxService } from './ofx.service';
import { OfxController } from './ofx.controller';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Category, User])],
  controllers: [OfxController],
  providers: [OfxService],
})
export class OfxModule {}
