import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from '../data/idata.service';
import { ApplicationUser } from '../data/entity';
import { v4 } from 'uuid';
import { UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto } from '../dto';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';

@Injectable()
export class UsersService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(private readonly dataService: IDataService) {}

  // I don't want the Service classes to throw Exceptions if a User isn't found.
  // I would prefer to have the Controller or any other consumer determine if not finding
  // a User is an error or not.
  // If a real exception happens, then let it bubble up
  // We should create a Top level Exception handler that shows different information
  // depending on the environment (dev, prod, etc)
  // We would also want to Log these Errors (but only 'real' errors should be logged as errors)
  public async getUserById(id: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserById: Getting User by Id: ${id}`);

    const result = await this.dataService.users.findOneBy({ id });
    const dtoResult = DtoMapper.toDto(result, UserResponseDto);

    return dtoResult;
  }

  // Need to expose a more generic 'Search' method on the Repository
  // I do not want to have tons of these simple Methods that do the same thing
  // With the only difference being what field is being looked up by
  public async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserByEmail: Getting User by Email: ${email}`);

    const result = await this.dataService.users.findOneBy({ email });
    const dtoResult = DtoMapper.toDto(result, UserResponseDto);

    return dtoResult;
  }

  public async getUserByPhoneNumber(phoneNumber: string): Promise<UserResponseDto | null> {
    this.logger.debug(`getUserByPhoneNumber: Getting User by Phone Number: ${phoneNumber}`);

    const result = await this.dataService.users.findOneBy({ phoneNumber });
    const dtoResult = DtoMapper.toDto(result, UserResponseDto);

    return dtoResult;
  }

  public async createUser(input: UserCreateRequestDto): Promise<UserResponseDto | null> {
    this.logger.debug(`createUser: Creating User: ${input.email}`);

    // Hack for now
    this.fixUpUserPhoneNumber(input);

    const user = EntityMapper.toEntity(input, ApplicationUser);
    user.id = v4();
    // TODO: Do we really want to assign id here instead of Database?
    // If service will generate uuid then we keep full control support for tests cases with pre-defined ids
    const result = await this.dataService.users.create(user);
    const dtoResult = DtoMapper.toDto(result, UserResponseDto);

    return dtoResult;
  }

  public async updateUser(input: UserUpdateRequestDto): Promise<boolean> {
    this.logger.debug(`updateUser: Updating User: ${input.id}`);

    // Hack for now
    this.fixUpUserPhoneNumber(input);

    // TODO: Update method requires separate 'id' and 'ApplicationUser' object which already contain this
    // Also 'update' method gets 'ApplicationUser' where all fields are required, while update should support partial (up to one field) updates, isnt it?
    // So here is a point where we should decide what way we will choose:
    // - change base 'update' method to support partial updates (along with data validation)
    // - do updates in 'merge' way where each field goes through check 'is change provided or not' and then update
    // For me p.1 seems way easier and straightforward
    const user = EntityMapper.toEntity(input, ApplicationUser);
    const result = await this.dataService.users.update(user.id, user);
    return result;
  }

  private fixUpUserPhoneNumber(user: { phoneNumber?: string; normalizedPhoneNumber?: string }) {
    if (user.phoneNumber) {
      user.phoneNumber = user.normalizedPhoneNumber;
      delete user.normalizedPhoneNumber;
    }
  }
}
