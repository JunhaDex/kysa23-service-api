import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RegisterModule } from '@/resources/register/register.module';
import { UserModule } from '@/resources/user/user.module';

@Module({
  imports: [ConfigModule.forRoot(), RegisterModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
