import { Controller, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@library/dto/request';
import { UserResponseDto } from '@library/dto/response';
import { ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ValidateOptionalQueryParamsPipe } from '@library/shared/common/pipes/optional.params.pipe';


@Controller('users')
export class UsersController {
  private readonly logger: Logger = new Logger(UsersController.name);

  constructor(
    private readonly userService: UsersService
  ) {}

  @Get(':id')
  @ApiParam({name: 'id', required: true, description: 'User id'})
  @ApiOkResponse({description: 'Get User by Id', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid Id', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  public async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const result = await this.userService.getUserById(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  //GET /users?email=test@mail.com
  //GET /users?phoneNumber=1234567890
  @ApiQuery({name: 'phoneNumber', required: false, description: 'User phone number'})
  @ApiQuery({name: 'email', required: false, description: 'User email'})
  @ApiQuery({name: 'crash', required: false, description: 'User crashes'})
  @ApiOkResponse({description: 'Get User by phone number', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid phone number', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Get('/')
  public async getUserByParameter(@Query(new ValidateOptionalQueryParamsPipe(['phoneNumber', 'email'])) data: any ): Promise<UserResponseDto> {
    const { email, phoneNumber, crash } = data;
    let result: UserResponseDto | null;

    // Some test stuff to try and get the Error logs doing what I want them to
    if (crash) {
      throw new Error('Crash!');
    }

    if(email) {
      result = await this.userService.getUserByEmail(email);
    }
    else if(phoneNumber) {
      result = await this.userService.getUserByPhoneNumber(phoneNumber);
    }

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NO_CONTENT);    
    }

    return result;
  }

  @ApiBody({type: UserCreateRequestDto})
  @ApiOkResponse({description: 'Created a new User', type: UserResponseDto, isArray: false})
  @ApiBadRequestResponse({description: 'Invalid User data payload provided', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Post()
  public async createUser(@Body() user: UserCreateRequestDto): Promise<UserResponseDto> {
    return await this.userService.createUser(user);
  }

  @ApiBody({type: UserUpdateRequestDto})
  @ApiOkResponse({description: 'Updated existing User', type: UserResponseDto, isArray: false})
  @ApiBadRequestResponse({description: 'Invalid User data payload provided', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Put()
  public async updateUser(@Body() user: UserUpdateRequestDto): Promise<boolean> {
    return await this.userService.updateUser(user);
  }
}
