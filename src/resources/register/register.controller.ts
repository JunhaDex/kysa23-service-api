import {
  Controller,
  Post,
  Body,
  Logger,
} from '@nestjs/common';
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

  @Post('/send')
  sendMail() {
    return '';
  }
}
