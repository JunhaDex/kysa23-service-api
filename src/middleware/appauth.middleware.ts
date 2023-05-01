import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AppauthMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: (error?: any) => void): Promise<any> {
    console.log('app middleware');
    req.uid = 'foobar';
    next();
  }
}
