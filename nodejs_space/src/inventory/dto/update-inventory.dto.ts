import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
  @ApiProperty({ example: 'Laptop', description: 'Name of the inventory item', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Dell XPS 15 laptop', description: 'Description of the item', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 50, description: 'Stock level', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockLevel?: number;

  @ApiProperty({ example: 'units', description: 'Unit of measurement', required: false })
  @IsString()
  @IsOptional()
  unit?: string;
}
