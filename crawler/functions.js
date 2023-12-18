function csvToJSON(csv_string){
  const rows = csv_string.split("\r\n");
  const jsonArray = [];
  const header = rows[0].split(",");
  for(let i = 1; i < rows.length; i++){
      let obj = {};
      let row = rows[i].split(",");
      for(let j=0; j < header.length; j++){
          obj[header[j]] = row[j];
      }
      jsonArray.push(obj);
  }
  return jsonArray;
}

function createFolderIfNotExists(fs, folderPath) {
  fs.readdir(folderPath, (err) => {
    if (err) {
      console.error(`Folder does not exist at ${folderPath}. Creating it now...`);
      fs.mkdirSync(folderPath);
    }
  });
}

function getDate() {
  const date = new Date();
  const day = new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0];
  const hours = ('0' + date.getHours()).slice(-2); 
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  return day + "_" + hours + minutes + seconds;
};

async function cafe(page, link) {
  const iframe = require('puppeteer-get-iframe').iframeAttached;
  const elementHandle = await iframe(page, 'cafe_main');
  await Promise.race([
    elementHandle.waitForSelector('h3.title_text'), // name
    elementHandle.waitForSelector('.se-component.se-text.se-l-default'), // buying comment
    elementHandle.waitForSelector('.se-component.se-image.se-l-default'), // images
  ]);

  const name = await elementHandle.evaluate(() => {
    return document.querySelector('h3.title_text') && document.querySelector('h3.title_text').innerText;
  });
  const text = await elementHandle.evaluate(() => {
    return document.querySelector('.se-component.se-text.se-l-default') && document.querySelector('.se-component.se-text.se-l-default').innerText;
  });
  const imgs = await elementHandle.evaluate(() => {
    return document.querySelector('.se-component.se-image.se-l-default') && Array.from(document.querySelectorAll('.se-component.se-image.se-l-default img')).map((img) => img.src).join();
  });

  return [link, name, text, imgs];
} 

async function smartstore(page, link, info) {
  await page.goto(link);
  await Promise.race([
    page.waitForSelector('h3._copyable'), // name
    page.waitForSelector('.blind > ._1LY7DqCnwR'), // prices
    page.waitForSelector('button > span.blind') //  options
  ]);

  const subject = await page.evaluate(() => {
    return document.querySelector('h3._copyable') && document.querySelector('h3._copyable').innerText;
  });
  
  await page.setDefaultNavigationTimeout(9000);
  await scrollPageVertically(page, 500); 
  await page.click('button._1gG8JHE9Zc');
  await scrollPageToEnd(page);
  const content = await page.evaluate(() => {
    return document.querySelector('.se-text-paragraph.se-text-paragraph-align-center') && Array.from(document.querySelectorAll('.se-text-paragraph.se-text-paragraph-align-center')).map((a) => a.innerText );
  });

  const img = await page.evaluate(() => {
    return document.querySelector('.se-module-image-link.__se_image_link.__se_link img') && Array.from(document.querySelectorAll('.se-module-image-link.__se_image_link.__se_link img')).map((a) => a.src ).filter((a) => a.startsWith('https://') );
  });
  let imgLinks = [];
  img.forEach((m,idx) => { if(idx>2 && idx<img.length-2) imgLinks.push(m) });
  return [subject, info.Price, info.Option, content.join(), imgLinks.join()];
}   

async function scrollPageToEnd(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      const timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function scrollPageVertically(page, distance) {
  await page.evaluate(async (distance) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= 10572) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, distance);
}

module.exports = {
  csvToJSON,
  createFolderIfNotExists,
  getDate,
  cafe, 
  smartstore
};