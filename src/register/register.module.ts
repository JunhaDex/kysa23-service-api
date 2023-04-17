import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';
import { FireauthMiddleware } from '../middleware/fireauth.middleware';

@Module({
  controllers: [RegisterController],
  providers: [RegisterService],
})
export class RegisterModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(FireauthMiddleware)
      .forRoutes({ path: '/register', method: RequestMethod.POST });
  }
}
