import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderNumber: string;

  @CreateDateColumn()
  date: Date;

  @Column()
  quantity: number;

  @Column()
  productName: string;

  @Column()
  price: number;
  @Column('decimal', { precision: 10, scale: 2 })
  finalPrice: number;
}
