import { BadRequestException, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { IRequest } from '@library/shared/types';
import { UserResponseDto } from '../dto';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ description: 'Get User Details', summary: 'Get User Details' })
  @ApiOkResponse({ description: 'User Details', type: UserResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'User not registered', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found', isArray: false })
  public async getSelf(@Req() request: IRequest): Promise<UserResponseDto> {
    if (!request.user || !request.user.id) {
      throw new BadRequestException('User not registered');
    }
    const userId = request.user.id;
    return this.usersService.getUserDetails(userId);
  }
}
