import { appendSheet, getForm, getSheet } from '../providers/gdrive.provider';
import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Register } from '../types/entity.type';
import inquirer from 'inquirer';

const DOC_NAME_REGISTER = 'test';
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

export async function pullFormData() {
  const ROWNUM = 2; // min = 2
  const formData = (await getForm(ROWNUM)).filter((row: any[]) => !!row[0]);
  // console.log(formData);
  const app = await getFirebase();
  const db = getDatabase(app);
  const regDoc = db.ref(DOC_NAME_REGISTER);
  for (const row of formData) {
    //cleaning
    const key = btoa(row[1]);
    row[5] = row[5].replace('와드', '').replace('지부', '');
    row[6] = row[6] === 'TRUE';
    row[7] = row[7].split(',').map((day: string) => Number(day));
    row[8] = Number(row[8]);
    //encapsulation
    const register = {} as Register;
    FORM_ORDER.map((value, i) => {
      register[value] = row[i];
    });
    console.log(register);
    register.uid = key;
    const reg = await regDoc.child(key).once('value');
    if (!reg.val()) {
      //update
    } else {
      console.log('WARNING: Email Duplication: ', JSON.stringify(register));
    }
  }
}

export async function updateSheetInfo() {
  // get unregistered register info from DB
  let recentReg = 0;
  const latest = (await getSheet('general')).pop();
  if (latest) {
    recentReg = Number(latest[8]);
  }
  const app = await getFirebase();
  const db = getDatabase(app);
  const docReg = db.ref(DOC_NAME_REGISTER);
  console.log(`Recent timestamp: ${recentReg}`);
  const newbie = await docReg
    .orderByChild('createdAt')
    .startAfter(recentReg)
    .once('value');
  const columnOrder = [
    'name',
    'uid',
    'dob',
    'geo',
    'sex',
    'contact',
    'joins',
    'createdAt',
    'createdAt',
  ] as const;
  const sheetData: any[][] = [];

  // format sheet data
  console.log(!!newbie.val() ? 'Newbie Found 🎉' : 'Register Up To Date 😎');
  if (newbie.val()) {
    const list = Object.values(newbie.val());
    console.log(`Updating ${list.length} rows...`);
    for (const reg of list) {
      const row = [];
      columnOrder.forEach((key) => {
        const cell = reg[key];
        if (typeof cell === 'object') {
          row.push(cell.join(', '));
        } else if (typeof cell === 'number') {
          row.push(cell.toString());
        } else {
          row.push(cell);
        }
      });
      row.push('온라인');
      sheetData.push(row);
    }
    // sync data
    await appendSheet(sheetData, 'general');
    console.log('Data Upload Completed! 🚀');
  }
  console.log('[[[ End of Process ]]]');
}
