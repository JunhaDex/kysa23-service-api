import { Response } from '@/types/general.type';

export const PAGE_SIZE = 10;

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

export function paginateUser(
  list: any[],
  page: number,
  pageSize: number,
  option?: any,
): { count: number; list: any[] } {
  const pgn = { count: 0, list };
  if (option) {
    for (const key of Object.keys(option)) {
      if (key !== 'page' && option[key]) {
        pgn.list = pgn.list.filter((item) => item[key].includes(option[key]));
      }
    }
  }
  pgn.count = pgn.list.length;
  pgn.list.sort((a, b) => {
    const an = Number(a.group.substring(1));
    const bn = Number(b.group.substring(1));
    return an - bn;
  });
  if (pgn.list.length > pageSize) {
    pgn.list = pgn.list.slice((page - 1) * pageSize, page * pageSize);
  } else {
    if (page > 1) {
      pgn.list = [];
    }
  }
  return pgn;
}

export function paginateMessage(
  list: any[],
  page: number,
  pageSize: number,
): { count: number; list: any[] } {
  const pgn = { count: 0, list };
  pgn.count = pgn.list.length;
  if (pgn.list.length > pageSize) {
    pgn.list = pgn.list.slice((page - 1) * pageSize, page * pageSize);
  } else {
    if (page > 1) {
      pgn.list = [];
    }
  }
  return pgn;
}
