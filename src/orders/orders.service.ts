import { isUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DataSource, Repository } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('OrdersService');
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      const { price, productName, quantity } = createOrderDto;
      const order = this.ordersRepository.create({
        price,
        productName,
        quantity,
        orderNumber: this.generateRandomString(10),
        finalPrice: quantity * price,
      });

      await this.ordersRepository.save(order);
      return { order };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const order = await this.ordersRepository.find({
      take: limit,
      skip: offset,
    });
    return order.map((order) => ({
      ...order,
    }));
  }

  async findOne(term: string) {
    let order: Order;
    if (isUUID(term)) {
      order = await this.ordersRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.ordersRepository.createQueryBuilder('order');
      order = await queryBuilder
        .where('UPPER(productName) = :productName ', {
          productName: term.toUpperCase(),
        })
        .getOne();
    }

    if (!order) {
      throw new NotFoundException(`Order with id, ${term} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.ordersRepository.preload({
      id: id,
      ...updateOrderDto,
    });
    if (!order) throw new NotFoundException(`Order with id, ${id} not found`);
    //Create Query Builder
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      order.finalPrice = order.price * order.quantity;
      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOne(id);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }
  private generateRandomString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error check server logs',
    );
  }
}
