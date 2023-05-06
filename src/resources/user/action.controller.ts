import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('send')
export class UserActionController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /send/match
   * @param req: req.uid sender id
   * @param rid: recipient id
   */
  @Post('match')
  sendContact(@Req() req: any, @Body('recipientId') rid: string) {
    const sid = req.uid;
    return this.userService.sendMatch(sid, rid);
  }
}
