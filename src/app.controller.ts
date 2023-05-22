import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import * as sgMail from '@sendgrid/mail';
import { getFirebase } from './providers/firebase.provider';
import { getAuth } from 'firebase-admin/auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hc')
  healthCheck(): string {
    return this.appService.getHello();
  }
}
