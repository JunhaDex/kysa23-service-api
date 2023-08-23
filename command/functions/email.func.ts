import * as fs from 'fs';
import sgMail from '@sendgrid/mail';
import {
  getCoupon,
  getSheet,
  updateTimestamp,
} from '../providers/gdrive.provider';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as process from 'process';
import { unixNow } from '../../src/utils/index.util';

const priceTag = `
<div class="price-tag-bg bg-blue">
    <div class="price-tag">
      <div style="text-align: center; font-weight: bold; margin-bottom: 2rem; font-size: 1.2rem">대회 참가비</div>
      <div style="text-align: center; font-size: 2.2rem; font-weight: bold; margin-bottom: 2rem; color: #052f5f">
        <%price%> <span style="font-size:1.3rem; font-weight: bold; color: #555555">원</span></div>
      <div style="text-align: center; color: #555555">
        <a href="https://kysa23-finance.notion.site/2023-2e75c081bf054430ab54e7fbd8e8b7f2" target="_blank"
           style="color: #555555">납부방법</a> 확인하기
      </div>
    </div>
  </div>`;

const specialTag = `
<div class="price-tag-bg bg-blue">
    <div class="price-tag">
      <div style="text-align: center; font-weight: bold; margin-bottom: 2rem; font-size: 1.2rem">대회 참가비</div>
      <div style="text-align: center; font-size: 2.2rem; font-weight: bold; margin-bottom: 2rem; color: #052f5f">
        60,000 <span style="font-size:1.3rem; font-weight: bold; color: #555555">원</span></div>
      <div style="text-align: center; color: #555555"><a
        href="https://kysa23-finance.notion.site/2023-2e75c081bf054430ab54e7fbd8e8b7f2" target="_blank"
        style="color: #555555">납부방법</a> 확인하기
      </div>
    </div>
  </div>`;

export async function sendGroupEmail() {
  const REGIDX = 750;
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const formData = (await getSheet(REGIDX + 13)).filter(
    (row: any[]) => !!row[0],
  );
  console.log(formData);
  const couponData = (await getCoupon(REGIDX + 2))
    .filter((row: any[]) => !!row[0])
    .map((row: string[]) => row[0]);
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `got ${formData.length} emails. and ${couponData.length} coupons. Press "Y" to continue?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  const timestamps: string[][] = [];
  let index = 0;
  for (const row of formData) {
    row[7] = row[7].split(',').map((day: string) => Number(day));
    row[8] = row[8];
    const obj = {
      recipient: row[5],
      user_name: row[0],
      user_phone: row[6] ?? '-',
      user_joins: `8월 ${row[7].join(', ')}일 (총 ${row[7].length}일)`,
      coupon_code: couponData[index],
    };
    let template = fs.readFileSync('./command/templates/welcome.html', {
      encoding: 'utf8',
    });
    for (const key of Object.keys(obj)) {
      template = template.replace(`<%${key}%>`, obj[key]);
    }
    template = template.replace(
      '<%price_tag%>',
      row[7].length === 3 ? specialTag : priceTag.replace('<%price%>', row[12]),
    );
    const msg = {
      to: obj.recipient,
      from: 'noreply@kysa.page',
      subject: '[2023 KYSA] 전국 청년대회에 등록해 주셔서 감사합니다.',
      html: template,
    };
    const current = unixNow(); // msg sent time
    try {
      const result = await sgMail.send(msg);
      if (result[0].statusCode < 299) {
        console.log(`Email sent to: ${obj.recipient} (${obj.user_name})`);
      } else {
        console.log(
          chalk.bgRed('DANGER: Error Code Uncommon: ', JSON.stringify(obj)),
        );
      }
    } catch (e) {
      console.log(
        chalk.bgRed(`ERROR: Send Failed(${e.code}): `, JSON.stringify(obj)),
      );
      console.error(JSON.stringify(e));
      timestamps.push(['']);
      await updateTimestamp(REGIDX + 13, REGIDX + 2, timestamps);
      throw new Error('Email Failed');
    }
    timestamps.push([current.toString()]);
    index++;
  }
  await updateTimestamp(REGIDX + 13, REGIDX + 2, timestamps);
}

export async function sendPaymentEmail() {
  const REGIDX = 600;
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  let formData = (await getSheet(REGIDX + 13)).filter((row: any[]) => !!row[0]);
  console.log(formData.length);
  formData = formData.filter((data) => data[15] === undefined);
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `got ${formData.length} emails. Press "Y" to continue?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  for (const row of formData) {
    row[7] = row[7].split(',').map((day: string) => Number(day));
    row[8] = row[8];
    const obj = {
      recipient: row[5],
      user_name: row[0],
      user_phone: row[6] ?? '-',
      user_joins: `8월 ${row[7].join(', ')}일 (총 ${row[7].length}일)`,
      user_fee: `${row[12]}원`,
    };
    let template = fs.readFileSync('./command/templates/payment.html', {
      encoding: 'utf8',
    });
    for (const key of Object.keys(obj)) {
      template = template.replace(`<%${key}%>`, obj[key]);
    }
    const msg = {
      to: obj.recipient,
      from: 'noreply@kysa.page',
      subject: '[2023 KYSA] 대회비 납부 알림',
      html: template,
    };
    try {
      const result = await sgMail.send(msg);
      if (result[0].statusCode < 299) {
        console.log(`Email sent to: ${obj.recipient} (${obj.user_name})`);
      } else {
        console.log(
          chalk.bgRed('DANGER: Error Code Uncommon: ', JSON.stringify(obj)),
        );
      }
    } catch (e) {
      console.log(
        chalk.bgRed(`ERROR: Send Failed(${e.code}): `, JSON.stringify(obj)),
      );
      console.error(JSON.stringify(e));
      throw new Error('Email Failed');
    }
  }
}
