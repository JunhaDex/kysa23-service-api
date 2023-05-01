import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserActionController } from './action.controller';
import { AppauthMiddleware } from '@/middleware/appauth.middleware';

@Module({
  controllers: [UserController, UserActionController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(AppauthMiddleware)
      .forRoutes(
        { path: '/user/*', method: RequestMethod.ALL },
        { path: '/action/*', method: RequestMethod.ALL },
      );
  }
}
