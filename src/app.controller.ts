import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import * as sgMail from '@sendgrid/mail';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/send')
  async sendMessage(): Promise<string> {
    const mailer = sgMail;
    mailer.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: '',
      from: '',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    await mailer.send(msg).catch((e) => console.error(e));
    return 'ok';
  }
}
