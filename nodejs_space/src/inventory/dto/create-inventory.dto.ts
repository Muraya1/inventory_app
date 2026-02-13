import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({ example: 'Laptop', description: 'Name of the inventory item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Dell XPS 15 laptop', description: 'Description of the item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 50, description: 'Stock level' })
  @IsNumber()
  @Min(0)
  stockLevel: number;

  @ApiProperty({ example: 'units', description: 'Unit of measurement' })
  @IsString()
  @IsNotEmpty()
  unit: string;
}
