import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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

  @Get()
  async findAll(@Param() params) {
    return await this.registerService.findAll({ page: params.page });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.registerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() regInfo: Register) {
    return this.registerService.update(id, regInfo);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registerService.remove(id);
  }
}
