module.exports = (name) => {
  const express = require('express');
  const app = express();
  const axios = require('axios');
  const fs = require('fs');
  require('dotenv').config();

  const client = {};
  if(name === 'madam') {
    client.id = process.env.MADAM_ID;
    client.secret = process.env.MADAM_PW;
  } else {
    client.id = process.env.SUNFLOWER_ID;
    client.secret = process.env.SUNFLOWER_PW;
  }
  const { id, secret } = client;
  let state = "RAMDOM_STATE";
  const redirectURI = encodeURI("https://cafe.naver.com/soimarket");
  let api_url = '';
  const file_name = 'data.json';
  const data = JSON.parse(fs.readFileSync(file_name).toString());

  app.get('/naverlogin', function (req, res) {
    api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + id + '&redirect_uri=' + redirectURI + '&state=' + state;
      res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
      res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
  });

  const getToken = () => {
    app.get('/callback', function (req, res) {
      const code = data.madam_code;
      state = 'RAMDOM_STATE';
      api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
        + id + '&client_secret=' + secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
      const request = require('request');
      const options = {
          url: api_url,
          headers: {'X-Naver-Client-Id':id, 'X-Naver-Client-Secret': secret}
        };
      request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
    });
  }
  const refreshToken = () => {
    app.get('/callback', function (req, res) {
      const refresh_token = name === 'madam'?data.madam_refresh_token:data.sunflower_refresh_token;
      api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=refresh_token&client_id='
      + id + '&client_secret=' + secret + '&refresh_token=' + refresh_token;
      const request = require('request');
      const options = {
        url: api_url,
        headers: {'X-Naver-Client-Id':id, 'X-Naver-Client-Secret': secret}
      };
      request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
          access_token = body.split(',')[0].replace('{"access_token":"','').replace('"','');
          if(name === 'madam') {
            data.madam_token = access_token;
          } else {
            data.sunflower_token = access_token;
          }
          fs.writeFileSync(file_name, JSON.stringify(data));
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      }); 

    });
  }
  // getToken();
  refreshToken();
       
  axios.get('http://127.0.0.1:3002/callback')
  .then(response => {
    console.log(response.data);
  }).catch(() => {
    console.log('에러');
  });

  app.listen(3002, function () {
    console.log('http://127.0.0.1:3002/naverlogin app listening on port 3002!');
  });
}