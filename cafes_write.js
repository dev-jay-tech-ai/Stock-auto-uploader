const getToken = require('./uploader/login');
const write = require('./uploader/write');
const schedule = require('node-schedule');
const fs = require('fs');
require('dotenv').config();
const file_name = 'data.json';
const data = JSON.parse(fs.readFileSync(file_name).toString());
const { madam_token, sunflower_token, index } = data;
const file = 'uk_stock_bag';

// write('madam',index,file,madam_token, null, null);
write('sunflower',index,file,sunflower_token,file_name, data);
/** 
  * Weekdays 1am - 5:50am UK time
  * Weekends 9am - 1:50pm UK time
*/

if(index < 30) {
  schedule.scheduleJob('0 0/10 1-6 * * 1-7',async () => { 
    console.log('Timer Started 🧨 💣 ✨ ', new Date().toString(), 'Working with index:', index);
    await write('madam',index,file,madam_token, null, null);
    setTimeout(async() =>{
      await write('sunflower',index,file,sunflower_token,file_name,data);
    });
  });
  schedule.scheduleJob('52 0-5 * * 1-7',async () => { 
    console.log('✨ 💃🏻 토큰 리셋 ✨ ', new Date().toString(), 'Working with index:', index);
    getToken('madam');
  });
  schedule.scheduleJob('53 0-5 * * 1-7',async () => { 
    console.log('✨ 🌻 토큰 리셋 ✨ ', new Date().toString(), 'Working with index:', index);
    getToken('sunflower');
  });
}
