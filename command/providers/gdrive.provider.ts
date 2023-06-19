import { google } from 'googleapis';
import cred from '../.config.json';
import path from 'path';
import { RegisterInput } from '../types/entity.type';

const GENERAL_RANGE = 'general!C14:L777';
const SENSITIVE_RANGE = 'sensitive!C14';
const STATS_RANGE = 'stats!C14';

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
  const range = `general!C${rowNum}:T${rowNum}`;
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: cred.sheetId,
    range,
  });
  return result.data.values ?? [];
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
