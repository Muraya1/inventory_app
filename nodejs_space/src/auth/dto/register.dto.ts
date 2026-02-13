import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Username for the account' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password for the account' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'], description: 'User role' })
  @IsEnum(['user', 'admin'])
  @IsNotEmpty()
  role: 'user' | 'admin';
}
