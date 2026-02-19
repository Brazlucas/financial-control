import { Controller, Post, Get, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DeleteResult, UpdateResult } from 'typeorm';
import { TransactionResponseDto } from './dto/response-transaction.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto, @UserId() userId: number): Promise<TransactionResponseDto> {
    return this.transactionService.create(dto, userId);
  }

  @Get()
  findAll(
    @UserId() userId: number,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ): Promise<{ data: TransactionResponseDto[]; total: number }>  {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    const l = limit ? parseInt(limit, 10) : 10;
    const p = page ? parseInt(page, 10) : 1;
    const c = categoryId ? parseInt(categoryId, 10) : undefined;

    const order = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return this.transactionService.findAll(userId, m, y, l, p, sortBy, order, c, search);
  }

  @Get('balance')
  getBalance(
    @UserId() userId: number,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('search') search?: string
  ): Promise<{ income: number; expense: number; balance: number }> {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.transactionService.getBalanceByUser(userId, m, y, search);
  }

  @Get('dashboard/charts')
  getChartData(
    @UserId() userId: number,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ): Promise<any> {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    const c = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.transactionService.getChartData(userId, m, y, c, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: number): Promise<TransactionResponseDto> {
    return this.transactionService.findOne(+id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto, @UserId() userId: number): Promise<UpdateResult> {
    return this.transactionService.update(+id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: number): Promise<DeleteResult> {
    return this.transactionService.remove(+id, userId);
  }
}
