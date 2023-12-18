module.exports = (name, product_index,file,token,index_name,json_index) => {
  const express = require('express');
  const fs = require("fs");
  const csv = require('csv-parser');
  const axios = require('axios');
  const app = express();
  const header = "Bearer " + token; // Bearer 다음에 공백 추가
  const clubid = name === 'madam'? process.env.MADAM_CLUBID:process.env.SUNFLOWER_CLUBID;
  const menuid = name === 'madam'? process.env.MADAM_MENUID:process.env.SUNFLOWER_MENUID;
  let results = [];
  fs.createReadStream('csv/'+ file +'.csv')
    .pipe(csv({}))
    .on('data',(data) => results.push(data))
    .on('end',() => {
      results.map((result,idx) => {
        const closer = async() => {
          let imag = '';
          let textOrg = '';
          const imgTags = result.ImgLinks;
          imgTags.split(',').forEach((img,idx) => {
            if(idx !== 0) imag += "<div style='height:30px'></div><img src="+ img +">"
          });
          let text = result.Content;
          text = text.replaceAll(/\s+(?=[^[\]]*\])/g,''); // []안에 공백을 삭제하는 로직 구현
          const price = String(result.Price).replace(/\B(?=(\d{3})+(?!\d))/g,'，');
          const priceStr = '[가격],' + price + ' 원,​,,,​,,,​,,';
          const opt = result.Option;
          let option = '';
          let optStr = '';
          if(String(opt).includes('_')) optStr = String(opt).replaceAll('_',' 사이즈,') + ' 사이즈';
          else optStr = String(opt) + ' 사이즈';
          if(opt !== '') option  = '[가능 옵션],' + optStr + ',​,,,​';
          const compoIdx = text.indexOf('[구성품]');
          const brandIdx = text.indexOf('[브랜드]');
          const rmCompo = text.indexOf('※높은')===-1?text.indexOf('※명품'):text.indexOf('※높은');
          const orgText = text.slice(0, compoIdx);
          let finText = '';
          const matchColor1 = orgText.match(/\[컬러](.*?)\[/);
          const matchColor2 = orgText.match(/\[색상](.*?)\[/);
          if(orgText.indexOf('[컬러]')!== -1) {
            if(matchColor1 !== null) finText = orgText.replace(matchColor1[0],'[');
            else finText = orgText.replace(/\[컬러].*/,'');
          } else if(orgText.indexOf('[색상]')!== -1) {
            if(matchColor2 !== null) finText = orgText.replace(matchColor2[0],'[');
            else finText = orgText.replace(/\[색상].*/,'');
          } else finText = orgText;
          if(orgText.indexOf('[사이즈]')!== -1) {
            finText = orgText.replace('사이즈','치수');
          } else finText = orgText;
          text = [finText, option, priceStr, text.slice(rmCompo-1)].join('');
          text.replaceAll(',​,​,​,​,​,​,​,​,​,​,​,​,​,','').replaceAll('네이버,','').slice(brandIdx-4,text.length).split('체크리스트')[0].split(',').forEach((txt,idx) => { 
            if(idx !== 0) textOrg += '<div style="text-align: center;">'+ encodeURI(txt.includes('라라런던')?txt.replace(''):txt); 
          });
          const subject = '- ' + encodeURI(result.Subject);
          const content = textOrg + imag;
          await app.get('/cafe/post/multipart',async (req, res) => {
            const api_url = 'https://openapi.naver.com/v1/cafe/' + clubid + '/menu/' + menuid + '/articles';
            const request = require('request');
            const _formData = {
              subject:subject,
              content:content,
              image: [
                {
                  value: fs.createReadStream('images/' + file + '/' + file + '_' + idx + '.jpg'),
                  options: { filename: file + '.jpg',  contentType: 'image/jpeg'}
                }
              ]
            };
            const _req = request.post({url:api_url, formData:_formData,
              headers: {'Authorization': header}}).on('response',(response) => {
              const symbol = name === 'madam' ? '💃🏻': '🌻';
              console.log(symbol, response.statusCode) // 200
            });
            _req.pipe(res); // 브라우저로 출력
          })  
          await axios.get('http://127.0.0.1:3002/cafe/post/multipart')
          .then((response) => {
            if(name !== 'madam') {
              json_index.index++;
              fs.writeFileSync(index_name, JSON.stringify(json_index));
              process.exit(1)
            }
          }).catch((err) => {
            console.log(err.response.data.errorMessage);
          });
        }  
        if(idx === product_index) {
          closer();
        }
      }); 
    }); 

  app.listen(3002,() => {
    console.log('http://127.0.0.1:3002/cafe/post/multipart app listening on port 3002!');
  });
}