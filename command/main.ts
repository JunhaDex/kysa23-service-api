import { Command } from 'commander';
import { createAppUser, setDailyCount } from './functions/user.func';
import * as process from 'process';
import { pullFormData, updateSheetInfo } from './functions/register.func';
import { sendGroupEmail } from './functions/email.func';
import * as dotenv from 'dotenv';
import { addCoupon } from './functions/misc.func';

dotenv.config();

const program = new Command();
program
  .version('1.0.0')
  .option('-sr --sync-register', 'update register sheet in drive')
  .option('-uu --update-user', 'get app users from register')
  .option('-rc --reset-count', 'reset daily count')
  .option('-se --send-email', 'send group email')
  .option('-mm --miscTest', 'cli test endpoint')
  .parse(process.argv);
// TODO: 모바일 알림
const options = program.opts();

function cb() {
  console.log('process finished');
  process.exit(0);
}

if (options.updateUser) {
  createAppUser().then(cb);
} else if (options.syncRegister) {
  pullFormData().then(cb);
} else if (options.sendEmail) {
  sendGroupEmail().then(cb);
} else if (options.resetCount) {
  setDailyCount().then(cb);
} else if (options.miscTest) {
  addCoupon().then(cb);
}
