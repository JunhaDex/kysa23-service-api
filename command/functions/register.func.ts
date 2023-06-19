import {
  appendSheet,
  getForm,
  markCopy,
} from '../providers/gdrive.provider';
import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Register } from '../types/entity.type';
import { unixNow } from '../../src/utils/index.util';
import chalk from 'chalk';
import inquirer from 'inquirer';

const DOC_NAME_REGISTER = 'register';
const FORM_ORDER = [
  'name',
  'email',
  'dob',
  'sex',
  'contact',
  'geo',
  'isMember',
  'joins',
  'consent',
] as const;
const COMMON_MAILER = [
  'gmail.com',
  'naver.com',
  'hanmail.net',
  'hotmail.com',
  'kakao.com',
  'nate.com',
  'churchofjesuschrist.org',
] as const;

export async function pullFormData() {
  const ROWNUM = 103; // min = 2
  const REGIDX = 98;
  const LANG: 'kor' | 'eng' = 'kor';
  const formData = (await getForm(ROWNUM, LANG)).filter(
    (row: any[]) => !!row[0],
  );
  let mCount = 0;
  for (const row of formData) {
    const email = row[1];
    const mailer = email.split('@')[1];
    if (mailer.length && !COMMON_MAILER.includes(mailer)) {
      console.log(chalk.yellow('WARNING: uncommon mailer detected: '), email);
      mCount++;
    }
  }
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `${mCount} mails are uncommon. Press "Y" to continue?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  const app = await getFirebase();
  const db = getDatabase(app);
  const regDoc = db.ref(DOC_NAME_REGISTER);
  const copied: string[][] = [];
  const sheetData: any[][] = [];
  for (const row of formData) {
    //cleaning
    const key = btoa(row[1]);
    row[4] = row[4].length < 5 ? '' : row[4];
    row[5] = row[5].replace('와드', '').replace('지부', '');
    row[6] = row[6] === 'TRUE';
    row[7] = row[7]
      .split(',')
      .map((day: string) => Number(day))
      .filter((x) => x > 0);
    row[8] = Number(row[8]);
    //encapsulation
    const register = {} as Register;
    FORM_ORDER.map((value, i) => {
      register[value] = row[i];
    });
    register.uid = key;
    const reg = await regDoc.child(key).once('value');
    if (!reg.val()) {
      //update
      const current = unixNow();
      register.createdAt = current;
      await regDoc.child(key).set(register);
      copied.push([current.toString()]);
      console.log(
        `Register Created: id: ${register.uid}, name: ${register.name}, email: ${register.email}`,
      );
      const regRow = updateSheetInfo(register);
      sheetData.push(regRow);
    } else {
      console.log(
        chalk.bgRed('DANGER: Email Duplication: ', JSON.stringify(register)),
      );
      copied.push(['']);
    }
  }
  await markCopy(ROWNUM, LANG, copied);
  await appendSheet(REGIDX + 14, sheetData);
  console.log(chalk.blue('INFO: Process Finished!'));
}

export function updateSheetInfo(register: Register) {
  const columnOrder = [
    'name',
    'uid',
    'dob',
    'geo',
    'sex',
    'email',
    'contact',
    'joins',
    'consent',
    'createdAt',
  ] as const;
  const row = [];
  columnOrder.forEach((key) => {
    const cell = register[key];
    if (typeof cell === 'object') {
      row.push(cell.join(', '));
    } else if (typeof cell === 'number') {
      row.push(cell.toString());
    } else if (cell === undefined) {
      row.push('');
    } else {
      row.push(cell);
    }
  });
  row.push('온라인');
  return row;
}
