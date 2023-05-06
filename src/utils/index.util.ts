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
