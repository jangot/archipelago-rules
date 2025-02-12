import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from "class-validator";

@ApiSchema({name: 'user'})
export class UserUpdateRequestDto {
    @ApiProperty({description: 'Id of the User', type: String, required: true})
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({description: 'User First Name', type: String, required: false, maxLength: 100})
    @Expose()
    @IsString()
    @MaxLength(100)
    @IsOptional()
    firstName?: string;
    
    @ApiProperty({description: 'User Last Name', type: String, required: false, maxLength: 100})
    @Expose()
    @IsString()
    @MaxLength(100)
    @IsOptional()
    lastName?: string;
    
    @ApiProperty({description: 'User email', type: String, required: false, maxLength: 320})
    @Expose()
    @IsEmail()
    @MaxLength(320)
    @IsOptional()
    email?: string;
    
    @ApiProperty({description: 'User phone number', type: String, required: false, maxLength: 32})
    @Expose()
    @MaxLength(32)
    @IsPhoneNumber()
    @IsOptional()
    phoneNumber?: string;
}