import {
  Controller,
  Post,
  Body,
  Req,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { okMessage } from '@/utils/index.util';
import { MessageDto } from '@/resources/user/dto/message.input';

@Controller('send')
export class UserActionController {
  private readonly logger;

  constructor(private readonly userService: UserService) {
    this.logger = new Logger(UserActionController.name);
  }

  /**
   * POST /send/match
   * @param req: req.uid sender id
   * @param message: recipient id (to) and isReveal
   */
  @Post('match')
  async sendContact(@Req() req: any, @Body() message: MessageDto) {
    const sid = req.uid;
    const { recipient, notify } = message;
    try {
      if (await this.userService.sendMatch(sid, recipient, notify)) {
        return okMessage;
      }
    } catch (e) {
      if (e.code === 401) {
        throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
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
   * GET /user/outbox
   * update user info
   * get uid from middleware
   * @param req: req.uid auth middleware
   * @param options: query options
   */
  @Get('outbox')
  async userOutbox(
    @Req() req: any,
    @Query()
    options?: {
      page: number;
    },
  ) {
    const uid = req.uid;
    return this.userService.getOutbox(uid, options);
  }

  @Get('count')
  async countSystem() {
    //TODO:
  }
}
