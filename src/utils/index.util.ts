import { Response } from "@/types/general.type";

export function unixNow(): number {
  return Math.floor(new Date().getTime() / 1000);
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
