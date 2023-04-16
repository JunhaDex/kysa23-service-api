import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RegisterService } from './register.service';
import { Register } from './entities/register.entity';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post()
  create(@Body() regInfo: Register) {
    return this.registerService.create(regInfo);
  }

  @Get()
  async findAll(@Param() params) {
    return await this.registerService.findAll({ page: params.page });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registerService.findOne(id);
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
