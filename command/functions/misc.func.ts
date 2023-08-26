import { getCoupon, updateTimestamp } from '../providers/gdrive.provider';
import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';

export async function addCoupon() {
  const couponData = (await getCoupon(2)).filter((row: any[]) => !!row[0]);
  const winner = {};
  for (const row of couponData) {
    winner[`_${row[0]}`] = {
      code: row[0],
      rank: row[2],
    };
  }
  console.log(winner);
  // const app = await getFirebase();
  // const db = getDatabase(app);
  // await db.ref('reg_coupon').set(winner);
}
