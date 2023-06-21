import { Response } from '@/types/general.type';

export const PAGE_SIZE = 4;

export function unixNow(): number {
  return Math.floor(new Date().getTime() / 1000);
}

export function getYearBorn(age = 1): number {
  const date = new Date();
  return date.getFullYear() - age + 1;
}

export const okMessage = {
  message: 'ok',
};

export function accessDenied(res: any, url: string) {
  const response: Response = {
    message: 'Access Denied',
    path: url,
    statusCode: 403,
    timestamp: unixNow(),
  };
  return res.status(403).json(response);
}

export function getJsonLog(obj: any): string {
  const keys = Object.keys(obj);
  let log = '';
  for (const key of keys) {
    log += `${key}: ${obj[key]}, `;
  }
  if (log.length) {
    log = log.slice(0, -2);
  }
  return log;
}
