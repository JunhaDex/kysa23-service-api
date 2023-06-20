import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { RegisterService } from './register.service';
import { Register } from './entities/register.entity';

@Controller('register')
export class RegisterController {
  private readonly logger;

  constructor(private readonly registerService: RegisterService) {
    this.logger = new Logger(RegisterController.name);
  }

  @Post()
  create(@Body() regInfo: Register) {
    return this.registerService.create(regInfo);
  }

  @Post('/send') // with create
  sendMail() {
    return '';
  }

  @Get('/stats')
  async getRegCount() {
    return await this.registerService.getCount();
  }
}
