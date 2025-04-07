import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UserDetailsUpdateRequestDto {
  @ApiProperty({ description: 'User First Name', type: String, required: false, maxLength: 100 })
  @Expose()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName: string | null;

  @ApiProperty({ description: 'User Last Name', type: String, required: false, maxLength: 100 })
  @Expose()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName: string | null;

  @ApiProperty({ description: 'User Date of Birth in ISO 8601 format YYYY-MM-DD', type: String, required: false, maxLength: 10 })
  @Expose()
  @IsString()
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Date of Birth must be in YYYY-MM-DD format' })
  @MaxLength(10)
  dateOfBirth: string | null;
    
  @ApiProperty({ description: 'User address line 1', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  addressLine1: string | null;
    
  @ApiProperty({ description: 'User address line 2', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  addressLine2: string | null;
    
  @ApiProperty({ description: 'User city', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  city: string | null;
    
  @ApiProperty({ description: 'User state', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  state: string | null;
    
  @ApiProperty({ description: 'User zip code', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  zipCode: string | null;
}
