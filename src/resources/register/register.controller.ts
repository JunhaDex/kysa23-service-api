import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Query,
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

  @Post('/send') // with create
  sendMail() {
    return '';
  }

  @Get('/stats')
  async getRegCount() {
    return await this.registerService.getCount();
  }

  @Get('/coupon/:id')
  async getCouponResult(@Param('id') id: string) {
    const res = await this.registerService.getCoupon(id);
    if (res) {
      return res;
    } else {
      throw new HttpException(`${id} Not Found`, HttpStatus.FORBIDDEN);
    }
  }

  @Post('find-me')
  async findRegister(@Body() userInfo: { name: string; phone: string }) {
    try {
      const register = await this.registerService.getRegister(userInfo);
      return {
        name: register.name,
        email: register.email,
      };
    } catch (e) {
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      }
    }
  }

  @Post('login')
  async findUser(@Body() userInfo: { email: string }) {
    try {
      const register = await this.registerService.getOneRegister(userInfo);
      return { register };
    } catch (e) {
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      }
    }
  }

  @Post('search/group')
  async searchGroup(
    @Body() userInfo: { email: string },
    @Query()
    options?: {
      group?: string;
    },
  ) {
    try {
      const res = await this.registerService.searchGroup(userInfo, options);
      return res;
    } catch (e) {
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      }
    }
  }

  @Post('search/name')
  async searchName(
    @Body() userInfo: { email: string },
    @Query()
    options?: {
      name?: string;
    },
  ) {
    try {
      const res = await this.registerService.searchName(userInfo, options);
      return res;
    } catch (e) {
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      }
    }
  }
}
