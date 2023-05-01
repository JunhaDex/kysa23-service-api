export function unixNow(): number {
  return Math.floor(new Date().getTime() / 1000);
}

export const okMessage = {
  message: 'ok',
};
