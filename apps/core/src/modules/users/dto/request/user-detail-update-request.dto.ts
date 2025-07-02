import { IsValidDateString } from '@library/shared/common/validator/date-string.validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiProperty({ description: 'User Date of Birth in the format MM/dd/yyyy', type: String, required: false, maxLength: 10 })
  @Expose()
  @IsString()
  @IsOptional()
  @IsValidDateString()
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
