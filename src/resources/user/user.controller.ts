import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /user/new
   * add app user information
   * user record already created from registers
   * @param createUserDto
   */
  @Post('new')
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }

  /**
   * POST /user/login
   * check ID, PW and update FCM
   * @param createUserDto
   */
  @Post('login')
  login(@Body() createUserDto: any) {
    // TODO update FCM, return new auth token
    return this.userService.create(createUserDto);
  }

  /**
   * Get user list
   * Filter by group
   */
  @Get('list')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch('me')
  update(@Body() updateUserDto: any) {
    const id = 0;
    return this.userService.update(id, updateUserDto);
  }
}
