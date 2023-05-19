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

export async function getSheet(type: RegisterInput) {
  const sheet = await bootstrap();
  const range = type === 'general' ? GENERAL_RANGE : SENSITIVE_RANGE;
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: cred.sheetId,
    range,
  });
  return result.data.values ?? [];
}

export async function appendSheet(rows: any[][], type: RegisterInput) {
  const sheet = await bootstrap();
  const range = type === 'general' ? GENERAL_RANGE : SENSITIVE_RANGE;
  await sheet.spreadsheets.values.append({
    spreadsheetId: cred.sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}
