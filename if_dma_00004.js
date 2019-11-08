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
        client_id:"3MVG9iLRabl2Tf4g2XAyYuODanLCeqa3uTma9Ax4ACprTeO5AqZXk6KHnXSDDyn52l7Pukc96mULKLAGGKiOJ",
        client_secret:"CAA1104F28306FDAF134CA7B711B48F3879EC229AE9A403175028625316605C7",
        username : "ifuser@shinsegae.com.partsb2",
        password : "ifpartsb1234"
    },
    headers: {},
    timeout: 5000
};

var options2 = {
    method: 'POST',
    uri: 'https://ssgtv--partsb2.my.salesforce.com/services/apexrest/IF_STCS_DMA_00004',
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
                           resolve(data);  
                       } else {
                           reject();
                       }           
                   });    
               }).catch();    
           };
        for( f in file_list){
            send_data.params.push(get_file(file_list[f]));  // check if it's file
        }
        Promise.all(send_data.params).then(function(value){
            send_data.params = value;
            send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
            fs.mkdirSync( "D:\\TeAnaApi\\file\\if_dma_00004_sent\\" + send_data.sendTime);
            
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