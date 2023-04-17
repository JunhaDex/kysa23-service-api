import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class FireauthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: any) => void): any {
    console.log('middleware');
    next();
  }
}
