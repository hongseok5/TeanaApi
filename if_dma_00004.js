const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
const fs = require('fs');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'if_dma_00004' },
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: './logs/if_dma_00004.log' })
    ]
  });
console.log("process.pid:"+process.pid);

var options1 = {
    method: 'POST',
    uri: 'https://ssgtv--devlje.my.salesforce.com/services/oauth2/token',
    form: {
        // Like <input type="text" name="name">
        grant_type:"password",
        client_id:"3MVG9Nvmjd9lcjRkjWfoalSWaGExJF.FecDvNfu6vnAOlWwJrST3o8SseKFLekDjvp9JK7CPIyNfBICFxHrK1",
        client_secret:"E65086E9D12E8912D0954AC1C783AD40080641A8C87D0F9B65D5C46872316C10",
        username : "sttif@shinsegae.dev",
        password : "sttdev1234"
    },
    headers: {},
    timeout: 5000
};

var options2 = {
    method: 'POST',
    uri: 'https://ssgtv--devlje.my.salesforce.com/services/apexrest/IF_SFDC_SSGTV_031',
    headers: {
        "Authorization" : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};

function getData(){
    var path = "D:\\TeAnaApi\\file\\if_dma_00004\\"
    var sj = schedule.scheduleJob('*/10 * * * * *', function(){
        var file_list = fs.readdirSync('./file/if_dma_00004');
        var send_data = {};
        send_data.params = [];

        var get_file = function(file_name){
            return new Promise(function(resolve, reject){
                   fs.readFile(path + file_name, 'utf-8', (err,data)=>{
                       if(err) throw err;
                       if(data !== undefined){
                           resolve(data);  // 여기서 파일 전송?
                       } else {
                           reject();
                       }           
                   });    
               }).catch();    
           };
        for( f in file_list){
            send_data.params.push(get_file(file_list[f]));
        }
        Promise.all(send_data.params).then(function(value){
            send_data.params = value;
            send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
            fs.mkdirSync( path + send_data.sendTime);
        
        }).catch("Failed!");

        rp(options1)
        .then(function (body) {
            var token = JSON.parse(body);
            options2.headers.Authorization = "OAuth " + token.access_token;
            req_body = JSON.stringify(send_data);
            console.log(req_body);
            options2.body = req_body;
            rp(options2).then(function ( data ){
                console.log("response is : " + data);
                logger.info(data);
            }).catch(function (err){
                console.error("error 2 : " + err);
            });
        })
        .catch(function (err) {
            console.error("error 1 : " + err);
        });
    });  
    sj.invoke();
}

//getData();
module.exports = getData;