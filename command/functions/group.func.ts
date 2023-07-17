import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/lib/database';

const DOC_NAME_REGISTER = 'register';
const OP_GRP = ['rlarlfah303@gmail.com', 'kjunha77@gmail.com'] as const;

export async function setGroup() {
  const app = await getFirebase();
  const db = getDatabase(app);
  const docRef = db.ref(DOC_NAME_REGISTER);
  const registers = (await docRef.once('value')).val() ?? {};
}
