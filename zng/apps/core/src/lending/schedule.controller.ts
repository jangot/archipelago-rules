import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';

@Controller('schedule')
@ApiTags('schedule')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  private readonly logger: Logger = new Logger(ScheduleController.name);
    
  constructor(private readonly scheduleService: ScheduleService) {}
    
  // to review a schedule for existing loan
  // TODO: including completed/failed payments?
  @Get(':id')
  @ApiOperation({ summary: 'Review a schedule for an existing loan', description: 'Retrieve the schedule for a loan using its ID. Optionally includes completed or failed payments.' })
  public async getSchedule(@UUIDParam('id') id: string): Promise<unknown> {
    this.logger.debug(`Getting schedule for loan with ID: ${id}`);
    return;
  }

  // to preview theoretical schedule for a loan based on input parameters
  @Post('preview')
  @ApiOperation({ summary: 'Preview a theoretical schedule for a loan', description: 'Generate a theoretical schedule for a loan based on the provided input parameters.' })
  public async previewSchedule(@Body() input: unknown): Promise<unknown> {
    this.logger.debug('Previewing schedule', { input });
    return;
  }
}
