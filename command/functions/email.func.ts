import * as fs from 'fs';
import sgMail from '@sendgrid/mail';
import { getSheet } from '../providers/gdrive.provider';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as process from 'process';

const priceTag = `
<div class="price-tag-bg bg-blue">
    <div class="price-tag">
      <div style="text-align: center; font-weight: bold; margin-bottom: 2rem; font-size: 1.2rem">대회 참가비</div>
      <div style="text-align: center; font-size: 3rem; font-weight: bold; margin-bottom: 2rem; color: #052f5f">
        <%price%> <span style="font-size:1.8rem; font-weight: bold; color: #555555">원</span></div>
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
      <div style="margin-left: 2.5rem; font-size: 1.5rem; text-decoration: line-through; color: #cec8d8">
        60,000 원
      </div>
      <div style="text-align: center; font-size: 3rem; font-weight: bold; margin-bottom: 2rem; color: #052f5f">
        50,000 <span style="font-size:1.8rem; font-weight: bold; color: #555555">원</span></div>
      <div style="text-align: center; color: #555555">얼리버드 할인 혜택 적용<br /> <a
        href="https://kysa23-finance.notion.site/2023-2e75c081bf054430ab54e7fbd8e8b7f2" target="_blank"
        style="color: #555555">납부방법</a> 확인하기
      </div>
    </div>
  </div>`;

export async function sendGroupEmail() {
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const REGIDX = 0;
  const formData = (await getSheet(REGIDX + 14)).filter(
    (row: any[]) => !!row[0],
  );
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
    };
    let template = fs.readFileSync('./command/templates/welcome.html', {
      encoding: 'utf8',
    });
    for (const key of Object.keys(obj)) {
      template = template.replace(`<%${key}%>`, obj[key]);
    }
    const price = priceTag.replace('<%price%>', row[888]);
    template = template.replace(
      '<%price_tag%>',
      obj.user_joins.length === 3 ? specialTag : price,
    );
    const msg = {
      to: obj.recipient,
      from: 'noreply@kysa.page',
      subject: '[2023 KYSA] 전국 청년대회에 등록해 주셔서 감사합니다.',
      html: template,
    };
    try {
      const result = await sgMail.send(msg);
      console.log(result[0].statusCode);
    } catch (e) {
      console.error(e);
      throw new Error('Email Failed');
    }
  }
}
