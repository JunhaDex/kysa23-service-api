import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('send')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('match')
  sendMatch(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }

  @Post('contact')
  sendContact(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }
}
