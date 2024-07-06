import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  productName: string;

  @IsNumber()
  quantity: number;
}
