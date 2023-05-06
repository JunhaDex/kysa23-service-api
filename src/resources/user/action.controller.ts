import {
  Controller,
  Post,
  Body,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { Message } from '@/resources/user/entities/user.entity';
import { okMessage } from '@/utils/index.util';

@Controller('send')
export class UserActionController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /send/match
   * @param req: req.uid sender id
   * @param message: recipient id (to) and isReveal
   */
  @Post('match')
  async sendContact(@Req() req: any, @Body() message: Message) {
    const sid = req.uid;
    const { to, isReveal } = message;
    if (to !== undefined && isReveal !== undefined) {
      if (await this.userService.sendMatch(sid, to, isReveal)) {
        return okMessage;
      }
    }
    throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
  }
}
