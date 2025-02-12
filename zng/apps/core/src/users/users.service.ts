import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from '../data/idata.service';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@library/dto/request';
import { UserResponseDto } from '@library/dto/response';
import { plainToClass } from 'class-transformer';
import { ApplicationUser } from '../data/entity';
import { v4 } from 'uuid';

@Injectable()
export class UsersService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    private readonly dataService: IDataService,
  ) { }

  // I don't want the Service classes to throw Exceptions if a User isn't found.
  // I would prefer to have the Controller or any other consumer determine if not finding
  // a User is an error or not.
  // If a real exception happens, then let it bubble up
  // We should create a Top level Exception handler that shows different information
  // depending on the environment (dev, prod, etc)
  // We would also want to Log these Errors (but only 'real' errors should be logged as errors)
  public async getUserById(id: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserById: Getting User by Id: ${id}`);

    const result = await this.dataService.users.getById(id);

    return result ? plainToClass(UserResponseDto, result, { excludeExtraneousValues: true }) : null;
  }

  // Need to expose a more generic 'Search' method on the Repository
  // I do not want to have tons of these simple Methods that do the same thing
  // With the only difference being what field is being looked up by
  public async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserByEmail: Getting User by Email: ${email}`);

    const result = await this.dataService.users.getByEmail(email);

    return result ? plainToClass(UserResponseDto, result, { excludeExtraneousValues: true }) : null;
  }

  public async getUserByPhoneNumber(phoneNumber: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserByPhoneNumber: Getting User by Phone Number: ${phoneNumber}`);

    const result = await this.dataService.users.getByPhone(phoneNumber);

    return result ? plainToClass(UserResponseDto, result, { excludeExtraneousValues: true }) : null;
  }

  public async createUser(input: UserCreateRequestDto): Promise<UserResponseDto | null> {
    this.logger.debug(`createUser: Creating User: ${input.email}`);

    // TODO: Do we really want to assign id here instead of Database?
    // If service will generate uuid then we keep full control support for tests cases with pre-defined ids
    const result = await this.dataService.users.create({ ...input, id: v4() });
    return result ? plainToClass(UserResponseDto, result, { excludeExtraneousValues: true }) : null;
  }

  public async updateUser(input: UserUpdateRequestDto): Promise<boolean> {
    this.logger.debug(`updateUser: Updating User: ${input.id}`);
    
    // TODO: Update method requires separate 'id' and 'ApplicationUser' object which already contain this
    // Also 'update' method gets 'ApplicationUser' where all fields are required, while update should support partial (up to one field) updates, isnt it?
    // So here is a point where we should decide what way we will choose:
    // - change base 'update' method to support partial updates (along with data validation)
    // - do updates in 'merge' way where each field goes through check 'is change provided or not' and then update
    // For me p.1 seems way easier and straightforward
    const { id } = input;
    const result = await this.dataService.users.update(id, { ...input } as ApplicationUser); // for sure we should avoid 'as' casts everywhere
    return result;
  }
}
