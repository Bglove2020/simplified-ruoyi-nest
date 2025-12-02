import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { LoggingService } from '@/common/logging/logging.service';

@Controller()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get('getInfo')
  async getInfo() {
    this.loggingService.log('GET /getInfo');
    const data = await this.profileService.getInfo();
    this.loggingService.log('GET /getInfo success', { responseDescriptor: { data: data } });
    return { code: 200, msg: '获取成功', data };
  }

  @Get('getRouters')
  async getRouters() {
    this.loggingService.log('GET /getRouters');
    const data = await this.profileService.getRouters();
    this.loggingService.log('GET /getRouters success', {
      responseDescriptor: { type: 'list', data: data },
    });
    return { code: 200, msg: '获取成功', data };
  }
}
