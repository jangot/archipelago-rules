import { JwtAuthGuard } from '@core/modules/auth/guards';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { PagingDto, PagingOptionsDto } from '@library/shared/common/paging';
import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { SearchFilterDto, SearchQueryDto } from '@library/shared/common/search';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
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
  ApiTags,
} from '@nestjs/swagger';
import { UserNotRegisteredException } from '../auth/exceptions/auth-domain.exceptions';
import { UserUpdateRequestDto } from './dto/request';
import { UserDetailResponseDto, UserDetailsUpdateResponseDto, UserResponseDto } from './dto/response';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  private readonly logger: Logger = new Logger(UsersController.name);

  constructor(private readonly userService: UsersService) {}

  
  //#region Self methods
  // Endpoints order in NestJS controller matters! 
  // If you put the @Get('/self') after the @Get(':id') it will never be called as the :id will always match
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
  @ApiOperation({ description: 'Update User', summary: 'Update User' }) 
  @ApiOkResponse({ description: 'User Updated', type: UserDetailsUpdateResponseDto, isArray: false }) 
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false }) 
  @ApiBadRequestResponse({ description: 'Updates can not be empty', isArray: false }) 
  @ApiNotFoundResponse({ description: 'User not found', isArray: false }) 
  @ApiInternalServerErrorResponse({ description: 'Could not apply updates', isArray: false }) 
  public async updateUser(@Req() request: IRequest, @Body() body: UserUpdateRequestDto): Promise<UserDetailsUpdateResponseDto> { 
    if (!request.user || !request.user.id) { 
      throw new UserNotRegisteredException('User not registered'); 
    } 
    if (!body) { 
      throw new MissingInputException('Updates can not be empty'); 
    } 
    const userId = request.user.id; 
    const updatedUser = await this.userService.updateUser(userId, body); 
    if (!updatedUser) { 
      throw new EntityNotFoundException('User not found'); 
    }
    return updatedUser;
  } 
  //#endregion

  @Get(':id')
  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
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

  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
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

  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
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

  @ApiBearerAuth('jwt') 
  @UseGuards(JwtAuthGuard)
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
