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
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SALT_STR'),
        };
      },
    }),
  ],
  controllers: [UserController, UserActionController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(AppauthMiddleware)
      .exclude({ path: '/user/login', method: RequestMethod.POST })
      .forRoutes(
        { path: '/user/*', method: RequestMethod.ALL },
        { path: '/action/*', method: RequestMethod.ALL },
      );
  }
}
