import {
  Controller,
  Post,
  Body,
  Req,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { okMessage } from '@/utils/index.util';
import { MessageDto } from '@/resources/user/dto/message.input';

@Controller('send')
export class UserActionController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /send/match
   * @param req: req.uid sender id
   * @param message: recipient id (to) and isReveal
   */
  @Post('match')
  async sendContact(@Req() req: any, @Body() message: MessageDto) {
    const sid = req.uid;
    const { recipient, notify } = message;
    if (await this.userService.sendMatch(sid, recipient, notify)) {
      return okMessage;
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
  async userInbox(@Req() req: any) {
    const uid = req.uid;
    return this.userService.getInbox(uid);
  }

  /**
   * GET /user/outbox
   * update user info
   * get uid from middleware
   * @param req: req.uid auth middleware
   * @param options: query options
   */
  @Get('outbox')
  async userOutbox(@Req() req: any) {
    const uid = req.uid;
    return this.userService.getOutbox(uid);
  }
}
