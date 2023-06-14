import { appendSheet, getSheet } from '../providers/gdrive.provider';
import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';

const DOC_NAME_REGISTER = 'test';
const fromFormKor = 'reg_data_kor';

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
