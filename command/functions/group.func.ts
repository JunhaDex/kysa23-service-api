import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Register } from '../types/entity.type';
import shuffleSeed from 'shuffle-seed';

const DOC_NAME_REGISTER = 'register';
const FILL_RATE = 0.7471;
const MAX_PER_GROUP = 12;
const EXP_REG_COUNT = 700;
const OP_GRP = [] as const;
const SHUFFLE_SEED = '2023KYSA';

export async function setGroup() {
  const app = await getFirebase();
  const db = getDatabase(app);
  const docRef = db.ref(DOC_NAME_REGISTER);
  const origin = (await docRef.once('value')).val() ?? {};
  const registers = {};
  for (const key of Object.keys(origin)) {
    if (!origin[key].group) {
      registers[key] = origin[key];
    }
  }
  console.log('DATABASE LOADED');
  const minSize = Math.floor(MAX_PER_GROUP * FILL_RATE);
  const maxSize = Math.ceil(MAX_PER_GROUP * FILL_RATE);
  const GCNT = Math.ceil(EXP_REG_COUNT / MAX_PER_GROUP / 2);
  console.log(`Group Count: ${GCNT}`);
  const baskets = Array.from({ length: GCNT + 1 }, () => {
    return {
      m: [] as Register[],
      f: [] as Register[],
    };
  });
  const opFilter = OP_GRP.map((email: string) => btoa(email));
  const rList: Register[] = Object.values(registers);
  const rmList: Register[] = [];
  const rfList: Register[] = [];
  for (const reg of rList) {
    if (opFilter.includes(reg.uid)) {
      reg.group = `${reg.sex}0`;
      baskets[0][reg.sex].push(reg);
    } else {
      if (reg.sex === 'm') {
        rmList.push(reg);
      } else {
        rfList.push(reg);
      }
    }
  }
  await shuffleGroup(rmList, baskets);
  await shuffleGroup(rfList, baskets);
  console.log("WHAT'S IN MY BASKET");
  const stats = baskets.map((item, idx) => {
    const mStat = `Group m${idx}` + ` length: ${item.m.length}`;
    const fStat = `Group f${idx}` + ` length: ${item.f.length}`;
    return mStat + '\n' + fStat;
  });
  console.log(stats.join('\n'));
  // return;
  await Promise.all(
    baskets.map((bsk) => {
      return new Promise(async (resolve) => {
        for (const reg of bsk.m) {
          await docRef.child(reg.uid).update(reg);
        }
        for (const reg of bsk.f) {
          await docRef.child(reg.uid).update(reg);
        }
        resolve(1);
      });
    }),
  );
}

async function shuffleGroup(registers: Register[], baskets) {
  const hBnd: Register[] = []; // higher bound (age more than median)
  const lBnd: Register[] = []; // Lower bound (age less than median)
  const ages = registers.map((reg) => reg.dob).sort();
  const ageMed: string =
    ages.length % 2 === 0
      ? ages[Math.floor(ages.length / 2) - 1]
      : ages[Math.floor(ages.length / 2)]; // age median
  for (const reg of registers) {
    if (reg.dob > ageMed) {
      hBnd.push(reg);
    } else {
      lBnd.push(reg);
    }
  }
  const fromTop = shuffleSeed.shuffle(hBnd, SHUFFLE_SEED);
  const fromBtm = shuffleSeed.shuffle(lBnd, SHUFFLE_SEED);
  const first = 1;
  const last = baskets.length - 1;
  for (let i = 0; i < fromTop.length; i++) {
    const factor = Math.floor(i / last);
    fromTop[i].group = `${fromTop[i].sex}${first + i - factor * last}`;
    baskets[first + i - factor * last][fromTop[i].sex].push(fromTop[i]);
  }
  for (let i = 0; i < fromBtm.length; i++) {
    const factor = Math.floor(i / last);
    fromBtm[i].group = `${fromBtm[i].sex}${last - i + factor * last}`;
    baskets[last - i + factor * last][fromBtm[i].sex].push(fromBtm[i]);
  }
}
