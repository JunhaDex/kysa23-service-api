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
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserCredential } from '@/resources/user/entities/user.entity';
import { okMessage } from '@/utils/index.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from '@/utils/file.pipe';

@Controller('user')
export class UserController {
  private readonly logger;

  constructor(private readonly userService: UserService) {
    this.logger = new Logger(UserController.name);
  }

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
      this.logger.error(`get user my: ${e.code} ${e.message}`);
      if (e.code === 403) {
        throw new HttpException(e.message, HttpStatus.FORBIDDEN);
      } else if (e.code === 404) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      } else if (e.code === 401) {
        throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
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
      this.logger.log(`user: ${req.uid} ${atob(req.uid)} / patch my done`);
      return okMessage;
    } else {
      this.logger.error(
        `user: ${req.uid} ${atob(req.uid)} / patch my not found`,
      );
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
  async login(@Body() credential: UserCredential) {
    try {
      return await this.userService.login(credential);
    } catch (e) {
      this.logger.error(
        `user: ${credential.email} ${credential.password} / login: ${e.code} ${e.message}`,
      );
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
   * @param req: req.uid auth middleware
   * @param options: query options
   */
  @Get('list')
  async findAll(
    @Req() req: any,
    @Query()
    options?: {
      page: number;
      geo?: string;
      name?: string;
      group?: string;
    },
  ) {
    const uid = req.uid;
    return this.userService.getList(uid, options);
  }

  /**
   * GET user/:id
   * get single user record
   * @param req: req.uid auth middleware
   * @param id
   */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.userService.getUser(req.uid, id);
  }
}
