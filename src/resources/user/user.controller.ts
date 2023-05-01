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
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserCredential } from '@/resources/user/entities/user.entity';
import { okMessage } from '@/utils/index.util';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /user/my
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

  /**
   * GET /user/inbox
   * update user info
   * get uid from middleware
   * @param req: req.uid auth middleware
   * @param options: query options
   */
  @Get('inbox')
  async userInbox(
    @Req() req: any,
    @Query()
    options?: {
      page: number;
    },
  ) {
    const uid = req.uid;
    return this.userService.getInbox(uid, options);
  }

  /**
   * POST /user/login
   * check ID, PW and update FCM
   * @Param credential: User ID, PWD, FCM
   */
  @Post('login')
  login(@Body() credential: UserCredential) {
    // TODO update FCM, return new auth token
    return this.userService.login(credential);
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
    return this.userService.getUser(id);
  }
}
