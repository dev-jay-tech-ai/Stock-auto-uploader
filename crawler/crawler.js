const puppeteer = require('puppeteer');
const stringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const { csvToJSON, getDate, cafe, smartstore, createFolderIfNotExists } = require('./functions');

createFolderIfNotExists(fs, '../csv');
const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1680,1080', '--disable-notifications'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1440 });
    const results = [];
    const file_csv = fs.readFileSync('data.csv');
    const string_csv = file_csv.toString();
    const arr_json = csvToJSON(string_csv);
    for(let info of arr_json) {
      const link = info[Object.keys(info)[0]];
      await page.goto(link);
      let arr;
      if(link == "") break;
      else {
        if(link.includes('smartstore')) {
          arr = await smartstore(page, link, info);
        } else {
          arr = await cafe(page, link);
        };
        results.push(arr);
      }
    } 
    await page.close();
    await browser.close();
    const str = stringify(results, { header: true, columns: [ 'Subject','Price','Option','Content','ImgLinks'] });
    fs.writeFileSync(`../csv/data_${getDate()}.csv`, str);
  } catch(err) {
    console.log(err)
  }
}

crawler();