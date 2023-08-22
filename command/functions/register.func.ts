import {
  appendSheet,
  BULK_VOLUME,
  getForm,
  getSheet,
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
  const ROWNUM = 775; // min = 2
  const REGIDX = 748;
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
    row[4] = row[4].length < 5 ? '' : row[4].replace(/[^0-9]/g, '');
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

export async function updateRegister() {
  // Get Database
  const app = await getFirebase();
  const db = getDatabase(app);
  const docRef = db.ref(DOC_NAME_REGISTER);
  const registers = (await docRef.once('value')).val() ?? {};
  console.log('DATABASE LOADED');
  // Load first 100 row data
  let formData = (await getSheet(14)).filter((row: any[]) => !!row[0]);
  let round = 1;
  const txs = [];
  const del = [];
  while (formData.length) {
    console.log(`START (${round}): ${formData.length} count`);
    for (const row of formData) {
      const reg = registers[row[1]];
      const canceled = !!row[16]?.length;
      if (reg) {
        // renew data and check if anything changed
        if (canceled) {
          del.push(reg);
        } else {
          const parsed = parseRegister(reg, row);
          if (parsed.isChanged) {
            txs.push(parsed.reg);
          }
        }
      }
    }
    // Reload next 100 row data
    formData = (await getSheet(14 + BULK_VOLUME * round)).filter(
      (row: any[]) => !!row[0],
    );
    console.log(
      `NEXT: ${14 + BULK_VOLUME * round} ~ ${14 + BULK_VOLUME * (round + 1)} (${
        formData.length
      })`,
    );
    console.log('changed: ', txs.length);
    round++;
  }
  console.log(JSON.stringify(txs));
  console.log(JSON.stringify(del));
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `changed: ${txs.length}, deleted: ${del.length} proceed?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  await Promise.all(txs.map((tx) => docRef.child(tx.uid).update(tx)));
  await Promise.all(del.map((tx) => docRef.child(tx.uid).set(null)));
}

function parseRegister(
  orig: Register,
  arr: any[],
): { reg: Register; isChanged: boolean } {
  const updated = {
    name: arr[0],
    dob: arr[2],
    geo: arr[3],
    sex: arr[4],
    joins: arr[7].split(', ').map((x) => Number(x)),
    contact: arr[6],
    group: arr[17] ?? '',
  };
  let isChanged = false;
  for (const key of Object.keys(updated)) {
    if (!orig[key] || orig[key].toString() !== updated[key].toString()) {
      isChanged = true;
      orig[key] = updated[key];
    }
  }
  return { reg: orig, isChanged };
}
