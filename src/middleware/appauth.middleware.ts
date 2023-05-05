import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';
import { accessDenied } from '@/utils/index.util';

@Injectable()
export class AppauthMiddleware implements NestMiddleware {
  constructor(private readonly jwt: JwtService) {}

  async use(req: any, res: any, next: (error?: any) => void): Promise<any> {
    const [type, auth] = req.headers.authorization?.split(' ') ?? [];
    const token = type === 'Bearer' ? auth : undefined;
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SALT_STR,
      });
      req.uid = payload.uid;
      req.payload = payload;
      next();
      return;
    } catch (e) {
      return accessDenied(res, req.url);
    }
  }
}
