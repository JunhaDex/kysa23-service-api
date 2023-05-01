import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { Response } from '@/types/general.type';
import { unixNow } from '@/utils/index.util';
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
    const bearer = req.headers.authorization;
    if (bearer) {
      try {
        const decoded = await this.fireAuth.verifyIdToken(
          bearer.replace('Bearer ', ''),
        );
        console.log(decoded);
        next();
      } catch (e) {
        this.logger.error(bearer, e.message);
        this.accessDenied(res, req.url);
      }
    } else {
      this.accessDenied(res, req.url);
    }
  }

  private accessDenied(res: any, url: string) {
    const response: Response = {
      message: 'Access Denied',
      path: url,
      statusCode: 403,
      timestamp: unixNow(),
    };
    res.status(403).json(response);
  }
}
