import { Controller, Delete, HttpException, HttpStatus, Logger, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Get, Post, Put, Param, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ValidateOptionalQueryParamsPipe } from '@library/shared/common/pipes/optional.params.pipe';
import { SearchFilterDto, SearchQueryDto } from '@library/shared/common/search';
import { PagingDto, PagingOptionsDto } from '@library/shared/common/paging';
import { ContactType } from '@library/entity/enum';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { IRequest } from '@library/shared/types';
import { UserNotRegisteredException } from '@core/domain/exceptions';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { JwtAuthGuard } from '@core/auth/guards';
import { UserCreateRequestDto, UserDetailResponseDto, UserDetailsUpdateRequestDto, UserDetailsUpdateResponseDto, UserResponseDto, UserUpdateRequestDto } from '@core/dto';

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
  @ApiOkResponse({ description: 'Get User by Id', type: UserDetailResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'User not found', isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Id', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async getUserDetailById(@UUIDParam('id') id: string): Promise<UserDetailResponseDto> {
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

  //#region Self methods
  @Get('/self') 
  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ description: 'Get User Details', summary: 'Get User Details' }) 
  @ApiOkResponse({ description: 'User Details', type: UserDetailResponseDto, isArray: false }) 
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false }) 
  @ApiNotFoundResponse({ description: 'User not found', isArray: false }) 
  public async getSelf(@Req() request: IRequest): Promise<UserDetailResponseDto> { 
    if (!request.user || !request.user.id) { 
      throw new UserNotRegisteredException('User not registered'); 
    } 
    const userId = request.user.id; 
    const user = await this.userService.getUserDetailById(userId); 
    if (!user) {
      throw new EntityNotFoundException('User not found');
    }
    return user;
  } 

  @Patch('/self')
  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ description: 'Update User Details', summary: 'Update User Details' }) 
  @ApiOkResponse({ description: 'User Details Updated', type: UserDetailsUpdateResponseDto, isArray: false }) 
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false }) 
  @ApiBadRequestResponse({ description: 'Updates can not be empty', isArray: false }) 
  @ApiNotFoundResponse({ description: 'User not found', isArray: false }) 
  @ApiInternalServerErrorResponse({ description: 'Could not apply updates', isArray: false }) 
  public async updateDetails(@Req() request: IRequest, @Body() body: UserDetailsUpdateRequestDto): Promise<UserDetailsUpdateResponseDto> { 
    if (!request.user || !request.user.id) { 
      throw new UserNotRegisteredException('User not registered'); 
    } 
    if (!body) { 
      throw new MissingInputException('Updates can not be empty'); 
    } 
    const userId = request.user.id; 
    const updatedUser = await this.userService.updateUserDetails(userId, body); 
    if (!updatedUser) { 
      throw new EntityNotFoundException('User not found'); 
    }
    return updatedUser;
  } 
  //#endregion
}
