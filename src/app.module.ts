import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RegisterModule } from './register/register.module';

@Module({
  imports: [ConfigModule.forRoot(), RegisterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
