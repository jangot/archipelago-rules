import { Controller, Delete, HttpException, HttpStatus, Logger, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Get, Post, Put, Param, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ValidateOptionalQueryParamsPipe } from '@library/shared/common/pipes/optional.params.pipe';
import { UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto } from '../dto';
import phone from 'phone';

@Controller('users')
export class UsersController {
  private readonly logger: Logger = new Logger(UsersController.name);

  constructor(private readonly userService: UsersService) {}

  @Get(':id')
  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ description: 'Get User by Id', type: UserResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'User not found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const result = await this.userService.getUserById(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  //GET /users?email=test@mail.com
  //GET /users?phoneNumber=1234567890
  @ApiQuery({ name: 'phoneNumber', required: false, description: 'User phone number' })
  @ApiQuery({ name: 'email', required: false, description: 'User email' })
  @ApiQuery({ name: 'crash', required: false, description: 'User crashes' })
  @ApiOkResponse({ description: 'Get User by phone number', type: UserResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'User not found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid phone number', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Get('/')
  public async getUserByParameter(
    @Query(new ValidateOptionalQueryParamsPipe(['phoneNumber', 'email'])) data: any
  ): Promise<UserResponseDto> {
    const { email, phoneNumber, crash } = data;
    let result: UserResponseDto | null;

    // Some test stuff to try and get the Error logs doing what I want them to
    if (crash) {
      throw new Error('Crash!');
    }

    if (email) {
      result = await this.userService.getUserByEmail(email);
    } else if (phoneNumber) {
      result = await this.userService.getUserByPhoneNumber(phoneNumber);
    }

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  @ApiBody({ type: UserCreateRequestDto })
  @ApiOkResponse({ description: 'Created a new User', type: UserResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid User data payload provided', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Post()
  public async createUser(@Body() user: UserCreateRequestDto): Promise<UserResponseDto> {
    // Validate phoneNumber separately here as we don't want to require the User to have to
    // enter this in the exact right way we are looking for.
    // Might want to consider adding an additional field in the Database that is a normalized version to go along with the user entered field
    const normalizedPhoneResult = phone(user.phoneNumber, { country: 'USA' });
    if (!normalizedPhoneResult || !normalizedPhoneResult.isValid)
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    user.normalizedPhoneNumber = normalizedPhoneResult?.phoneNumber ?? undefined;

    return await this.userService.createUser(user);
  }

  @ApiBody({ type: UserUpdateRequestDto })
  @ApiOkResponse({ description: 'Updated existing User', type: UserResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid User data payload provided', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Patch()
  public async updateUser(@Body() user: UserUpdateRequestDto): Promise<boolean> {
    // Validate phoneNumber separately here as we don't want to require the User to have to
    // enter this in the exact right way we are looking for.
    const normalizedPhoneResult = phone(user.phoneNumber, { country: 'USA' });
    if (!normalizedPhoneResult || !normalizedPhoneResult.isValid)
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    user.normalizedPhoneNumber = normalizedPhoneResult?.phoneNumber ?? undefined;

    return await this.userService.updateUser(user);
  }

  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ description: 'Deleted User', type: Boolean, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Delete(':id')
  public async deleteUser(@Param('id') id: string): Promise<boolean> {
    const result = await this.userService.deleteUser(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ description: 'Restored User', type: Boolean, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Put('restore/:id')
  public async restoreUser(@Param('id') id: string): Promise<boolean> {
    const result = await this.userService.restoreUser(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }
}
