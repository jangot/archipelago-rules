import { Controller, Delete, HttpException, HttpStatus, Logger, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Get, Post, Put, Param, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ValidateOptionalQueryParamsPipe } from '@library/shared/common/pipes/optional.params.pipe';
import { UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto } from '../dto';
import { SearchFilterDto, SearchQueryDto } from '@library/shared/common/search';
import { PagingDto, PagingOptionsDto } from '@library/shared/common/paging';
import { ContactType } from '@library/entity/enum';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { UserDetailResponseDTO } from '../dto/response/user-detail-response.dto';

@Controller('users')
@ApiTags('users')
export class UsersController {
  private readonly logger: Logger = new Logger(UsersController.name);

  constructor(private readonly userService: UsersService) {}

  @Get(':id')
  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ description: 'Get User by Id', type: UserResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'User not found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async getUserById(@UUIDParam('id') id: string): Promise<UserResponseDto> {
    const result = await this.userService.getUserById(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  // Using this to test out pgtyped stuff
  @Get('/test/:id')
  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ description: 'Get User by Id', type: UserDetailResponseDTO, isArray: false })
  @ApiNoContentResponse({ description: 'User not found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async getUserDetailById(@UUIDParam('id') id: string): Promise<UserDetailResponseDTO> {
    const result = await this.userService.getUserDetailById(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  //getUserDetailById
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
  public async getUserByParameter(@Query(new ValidateOptionalQueryParamsPipe(['phoneNumber', 'email'])) data: any): Promise<UserResponseDto> {
    const { email, phoneNumber, crash } = data;
    let result: UserResponseDto | null = null;

    // Some test stuff to try and get the Error logs doing what I want them to
    if (crash) {
      throw new Error('Crash!');
    }

    if (email) {
      result = await this.userService.getUserByContact(email, ContactType.EMAIL);
    } else if (phoneNumber) {
      result = await this.userService.getUserByContact(phoneNumber, ContactType.PHONE_NUMBER);
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
  public async createUser(@Body() user: UserCreateRequestDto): Promise<UserResponseDto | null> {
    return await this.userService.createUser(user);
  }

  @ApiBody({ type: UserUpdateRequestDto })
  @ApiOkResponse({ description: 'Updated existing User', type: UserResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid User data payload provided', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Patch()
  public async updateUser(@Body() user: UserUpdateRequestDto): Promise<boolean> {
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
  public async restoreUser(@UUIDParam('id') id: string): Promise<boolean> {
    const result = await this.userService.restoreUser(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  @ApiExtraModels(SearchQueryDto, SearchFilterDto, PagingOptionsDto)
  @ApiBody({ type: SearchQueryDto })
  @ApiOkResponse({ description: 'Found Users array with pagination meta', type: PagingDto<UserResponseDto> })
  @ApiNoContentResponse({ description: 'No Users found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid search parameters', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @Post('/search')
  public async searchUsers(@Body() query: SearchQueryDto): Promise<PagingDto<UserResponseDto>> {
    const result = await this.userService.search(query);

    if (!result.data.length) {
      throw new HttpException('No Users found', HttpStatus.NO_CONTENT);
    }

    return result;
  }
}
