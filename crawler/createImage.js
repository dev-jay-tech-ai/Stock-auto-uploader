const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const results = []; // 'Link', 'Name', 'Comments', 'Images'
const file = 'update_image';
const path = 'csv/'+file+'.csv';
fs.readdir('images/'+file, (err) => {
  if(err) {
    console.error('There is no folder. Create soon');
    fs.mkdirSync('images/'+file);
  }
})

fs.createReadStream(path)
  .pipe(csv({}))
  .on('data',(data) => results.push(data))
  .on('end',() => {
    results.map(async(result,idx) => {
      const links = result.ImgLinks;
      const link = links.split(','); 
      try {
        const imgResult = await axios.get((link[0]), { // 요청: 이미지주소 응답: 이미지 데이터
          responseType: 'arraybuffer', // buffer가 연속적으로 들어있는 자료구조
        });
        fs.writeFileSync(`images/${file}/${file}_${idx}.jpg`, imgResult.data);   
      } catch {
        console.error('에러')
      }
    })
  });