import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { Response } from '@/types/general.type';
import { accessDenied, unixNow } from '@/utils/index.util';
import { getFirebase } from '@/providers/firebase.provider';

@Injectable()
export class FireauthMiddleware implements NestMiddleware {
  private readonly fireAuth;
  private readonly logger;

  constructor() {
    const app = getFirebase();
    this.fireAuth = getAuth(app);
    this.logger = new Logger(FireauthMiddleware.name);
  }

  async use(req: any, res: any, next: (error?: any) => void): Promise<any> {
    const [type, auth] = req.headers.authorization?.split(' ') ?? [];
    const token = type === 'Bearer' ? auth : undefined;
    if (token) {
      try {
        const decoded = await this.fireAuth.verifyIdToken(token);
        console.log(decoded);
        next();
        return;
      } catch (e) {
        this.logger.error(e.message);
        return accessDenied(res, req.url);
      }
    } else {
      return accessDenied(res, req.url);
    }
  }
}
