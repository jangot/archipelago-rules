import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@library/dto/request';
import { UserResponseDto } from '@library/dto/response';
import { ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiParam({name: 'id', required: true, description: 'User id'})
  @ApiOkResponse({description: 'Get User by Id', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid Id', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }

  @ApiParam({name: 'email', required: true, description: 'User email'})
  @ApiOkResponse({description: 'Get User by email', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid email', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Get('byemail/:email')
  async getUserByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    return this.userService.getUserByEmail(email);
  }

  @ApiParam({name: 'phoneNumber', required: true, description: 'User phone number'})
  @ApiOkResponse({description: 'Get User by phone number', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid phone number', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Get('byphone/:phoneNumber')
  async getUserByPhoneNumber(@Param('phoneNumber') phoneNumber: string): Promise<UserResponseDto> {
    return this.userService.getUserByPhoneNumber(phoneNumber);
  }

  @ApiBody({type: UserCreateRequestDto})
  @ApiOkResponse({description: 'Created a new User', type: UserResponseDto, isArray: false})
  @ApiBadRequestResponse({description: 'Invalid User data payload provided', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Post()
  async createUser(@Body() user: UserCreateRequestDto): Promise<UserResponseDto> {
    return this.userService.createUser(user);
  }

  @ApiBody({type: UserUpdateRequestDto})
  @ApiOkResponse({description: 'Updated existing User', type: UserResponseDto, isArray: false})
  @ApiBadRequestResponse({description: 'Invalid User data payload provided', isArray: false})
  @ApiInternalServerErrorResponse({description: 'Internal Server Error', isArray: false})
  @Put()
  async updateUser(@Body() user: UserUpdateRequestDto): Promise<boolean> {
    return this.userService.updateUser(user);
  }
}
