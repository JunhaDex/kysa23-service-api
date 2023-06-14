import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserCredential } from '@/resources/user/entities/user.entity';
import { okMessage } from '@/utils/index.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from '@/utils/file.pipe';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /user/my
   * get user info (My own)
   * get uid from middleware
   * @param req: req.uid auth middleware
   */
  @Get('my')
  async getOwn(@Req() req: any) {
    const uid = req.uid;
    try {
      return this.userService.getMe(uid);
    } catch (e) {
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      } else if (e.code === 404) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * PATCH /user/my
   * update user info
   * get uid from middleware
   * @param req: req.uid auth middleware
   * @param userInfo: user info to update
   */
  @Patch('my')
  async update(@Req() req: any, @Body() userInfo: User) {
    const uid = req.uid;
    if (await this.userService.update(uid, userInfo)) {
      return okMessage;
    } else {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
  }

  @Post('my/image')
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @Req() req: any,
    @UploadedFile(new FileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    const uid = req.uid;
    if (file && (await this.userService.updateImage(uid, file))) {
      return okMessage;
    } else {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * POST /user/login
   * check ID, PW and update FCM
   * @Param credential: User ID, PWD, FCM
   */
  @Post('login')
  login(@Body() credential: UserCredential) {
    try {
      return this.userService.login(credential);
    } catch (e) {
      console.log(e.code);
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      } else if (e.code === 404) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Get /user/list
   * Filter by group
   * @Params options: query options
   */
  @Get('list')
  async findAll(
    @Query()
    options?: {
      page: number;
      geo?: string;
      name?: string;
      group?: string;
    },
  ) {
    return this.userService.getList(options);
  }

  /**
   * GET user/:id
   * get single user record
   * @param id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // TODO: 연락처 공개 여부 (나를알림 이거나 매칭성공 일 때)
    // TODO: 관심표현 가능 여부 (동성인 경우)
    return this.userService.getUser(id);
  }
}
