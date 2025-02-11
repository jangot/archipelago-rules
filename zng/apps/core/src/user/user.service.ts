import { HttpException, Injectable } from '@nestjs/common';
import { IDataService } from '../data/idata.service';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@library/dto/request';
import { UserResponseDto } from '@library/dto/response';
import { HttpStatusCode } from 'axios';
import { plainToClass } from 'class-transformer';
import { ApplicationUser } from '../data/entity';
import { v4 } from 'uuid';

@Injectable()
export class UserService {
    constructor(private readonly dataService: IDataService) {}

    public async getUserById(id: string): Promise<UserResponseDto> {
        try {
            const result = await this.dataService.users.getById(id);
            this.throwIfNotFound(result);
            return plainToClass(UserResponseDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error', HttpStatusCode.InternalServerError);
        }
    }

    public async getUserByEmail(email: string): Promise<UserResponseDto> {
        try {
            const result = await this.dataService.users.getByEmail(email);
            this.throwIfNotFound(result);
            return plainToClass(UserResponseDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error', HttpStatusCode.InternalServerError);
        }
    }

    public async getUserByPhoneNumber(phoneNumber: string): Promise<UserResponseDto> {
        try {
            const result = await this.dataService.users.getByPhone(phoneNumber);
            this.throwIfNotFound(result);
            return plainToClass(UserResponseDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error', HttpStatusCode.InternalServerError);
        }
    }

    public async createUser(input: UserCreateRequestDto): Promise<UserResponseDto> {
        try {
            // TODO: Do we really want to assign id here instead of Database?
            // If service will generate uuid then we keep full control support for tests cases with pre-defined ids
            const result = await this.dataService.users.create({ ...input, id: v4() });
            return plainToClass(UserResponseDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            // TODO: We should handle specific errors here, like 'email already exists' or 'phone number already exists'
            throw new HttpException('Internal server error', HttpStatusCode.InternalServerError);
        }
    }

    public async updateUser(input: UserUpdateRequestDto): Promise<boolean> {
        try {
            // TODO: Update method requires separate 'id' and 'ApplicationUser' object which already contain this
            // Also 'update' method gets 'ApplicationUser' where all fields are required, while update should support partial (up to one field) updates, isnt it?
            // So here is a point where we should decide what way we will choose:
            // - change base 'update' method to support partial updates (along with data validation)
            // - do updates in 'merge' way where each field goes through check 'is change provided or not' and then update
            // For me p.1 seems way easier and straightforward
            const { id } = input;
            const result = await this.dataService.users.update(id, { ...input } as ApplicationUser); // for sure we should avoid 'as' casts everywhere
            return result;
        } catch (error) {
            // TODO: We should handle specific errors here, like 'user not found' or 'email already exists' or 'phone number already exists'
            throw new HttpException('Internal server error', HttpStatusCode.InternalServerError);
        }
    }

    private throwIfNotFound(result: ApplicationUser): void {
        if(!result) {
            throw new HttpException('User not found', HttpStatusCode.NoContent);
        }
    }
}
