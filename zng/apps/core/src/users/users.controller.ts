import { BadRequestException, Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { IRequest } from '@library/shared/types';
import { UserDetailResponseDTO, UserDetailsUpdateRequestDto, UserDetailsUpdateResponseDto } from '../dto';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ description: 'Get User Details', summary: 'Get User Details' })
  @ApiOkResponse({ description: 'User Details', type: UserDetailResponseDTO, isArray: false })
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found', isArray: false })
  public async getSelf(@Req() request: IRequest): Promise<UserDetailResponseDTO> {
    if (!request.user || !request.user.id) {
      throw new BadRequestException('User not registered');
    }
    const userId = request.user.id;
    return this.usersService.getUserDetails(userId);
  }

  @Patch()
  @ApiOperation({ description: 'Update User Details', summary: 'Update User Details' })
  @ApiOkResponse({ description: 'User Details Updated', type: UserDetailsUpdateResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false })
  @ApiBadRequestResponse({ description: 'Updates can not be empty', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Could not apply updates', isArray: false })
  public async updateDetails(@Req() request: IRequest, @Body() body: UserDetailsUpdateRequestDto): Promise<UserDetailsUpdateResponseDto> {
    if (!request.user || !request.user.id) {
      throw new BadRequestException('User not registered');
    }
    if (!body) {
      throw new BadRequestException('Updates can not be empty');
    }
    const userId = request.user.id;
    return this.usersService.updateDetails(userId, body);
  }
}
