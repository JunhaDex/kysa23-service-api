import { google } from 'googleapis';
import cred from '../.config.json';
import path from 'path';
import { RegisterInput } from '../types/entity.type';

const BULK_VOLUME = 0;

export async function bootstrap() {
  const secPath = path.join(process.cwd(), cred.fbAdmin);
  const svcAcc = await import(secPath);
  const authorize = new google.auth.JWT({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  authorize.fromJSON(svcAcc);
  return google.sheets({ version: 'v4', auth: authorize });
}

export async function getSheet(rowNum: number) {
  const sheet = await bootstrap();
  // const range = `general!C${rowNum}:T${rowNum + 100}`;
  const range = `general!C${rowNum}:T${rowNum + BULK_VOLUME}`; //+100
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: cred.sheetId,
    range,
  });
  return result.data.values ?? [];
}

export async function getCoupon(rowNum: number, inst?: any) {
  let sheet = inst;
  if (!sheet) {
    sheet = await bootstrap();
  }
  const range = `coupon_event!A${rowNum}:A${rowNum + BULK_VOLUME}`;
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: cred.sheetId,
    range,
  });
  return result.data.values ?? [];
}

export async function updateTimestamp(
  rn1: number,
  rn2: number,
  timestamp: any,
) {
  const sheet = await bootstrap();
  const s_range = `general!Q${rn1}:Q${rn1 + BULK_VOLUME}`;
  // update sheet
  await sheet.spreadsheets.values.append({
    spreadsheetId: cred.sheetId,
    range: s_range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: timestamp },
  });
  // update coupon
  const c_range = `coupon_event!B${rn2}:B${rn2 + BULK_VOLUME}`;
  await sheet.spreadsheets.values.append({
    spreadsheetId: cred.sheetId,
    range: c_range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: timestamp },
  });
}

export async function appendSheet(rowNum: number, rows: any[][]) {
  const sheet = await bootstrap();
  const range = `general!C${rowNum}`;
  await sheet.spreadsheets.values.append({
    spreadsheetId: cred.sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}

export async function getForm(rowNum: number, lang: 'kor' | 'eng' = 'kor') {
  const sheet = await bootstrap();
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: cred.formId,
    range: `reg_data_${lang}!A${rowNum}:K${rowNum + 100}`,
  });
  return result.data.values ?? [];
}

export async function markCopy(
  rowNum: number,
  lang: 'kor' | 'eng' = 'kor',
  rows: any[][],
) {
  const sheet = await bootstrap();
  await sheet.spreadsheets.values.append({
    spreadsheetId: cred.formId,
    range: `reg_data_${lang}!K${rowNum}:K${rowNum + 100}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}
