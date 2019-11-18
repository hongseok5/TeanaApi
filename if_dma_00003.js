const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'if_dma_00003' },
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: './logs/if_dma_00003.log' })
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
    uri: 'https://ssgtv--partsb2.my.salesforce.com/services/apexrest/IF_STCS_DMA_00003',
    headers: {
        Authorization : null
    },
    timeout: 10000,
    body : ""
};
//var channel_codes = ["01", "02", "03", "04"];

var sj01 = schedule.scheduleJob('30 30 * * * *', function(){
    console.log("sj01 start");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    param = { "standardTime": now , "channel" : "01" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
    options2.body = JSON.stringify(param);
    rp(options2)
    .then(function ( data ){
    	data = JSON.parse(data);
    	if(data.status.code == "10"){
    		fs.mkdirSync(config.channel_save_path+data.data.channel);
        	var filename = config.channel_save_path+data.data.channel+"\\"+now+".JSON";
        	var filecontext = data.data.result.data_list;
            fs.writeFile(filename, filecontext, "utf8", function(err) {
            	logger.info("error file : " + err);
            });
        }else{
        	logger.info(data);
        }
        console.log(data);
    }).catch(function (err){
    	logger.info("error sj01 : " + err);
    });
});    
var sj02 = schedule.scheduleJob('20 30 * * * *', function(){
    console.log("sj02 start");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    param = { "standardTime": now , "channel" : "02" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};  
    options2.body = JSON.stringify(param);
    rp(options2)
    .then(function ( data ){
    	data = JSON.parse(data);
    	if(data.status.code == "10"){
    		fs.mkdirSync(config.channel_save_path+data.data.channel);
        	var filename = config.channel_save_path+data.data.channel+"\\"+now+".JSON";
        	var filecontext = data.data.result.data_list;
            fs.writeFile(filename, filecontext, "utf8", function(err) {
            	logger.info("error file : " + err);
            });
        }else{
        	logger.info(data);
        }
        console.log(data);
    }).catch(function (err){
    	logger.info("error sj02 : " + err);
    });
});    
var sj03 = schedule.scheduleJob('10 30 * * * *', function(){
    console.log("sj03 start");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    param = { "standardTime": now , "channel" : "03" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
    options2.body = JSON.stringify(param);
    rp(options2)
    .then(function ( data ){
    	data = JSON.parse(data);
    	if(data.status.code == "10"){
    		fs.mkdirSync(config.channel_save_path+data.data.channel);
        	var filename = config.channel_save_path+data.data.channel+"\\"+now+".JSON";
        	var filecontext = data.data.result.data_list;
            fs.writeFile(filename, filecontext, "utf8", function(err) {
            	logger.info("error file : " + err);
            });
        }else{
        	logger.info(data);
        }
        console.log(data);
    }).catch(function (err){
    	logger.info("error sj03 : " + err);
    });
});    
var sj04 = schedule.scheduleJob('0 30 * * * *', function(){
    console.log("sj04 start");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    param = { "standardTime": now , "channel" : "04" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
    options2.body = JSON.stringify(param);
    rp(options2)
    .then(function ( data ){
        data = JSON.parse(data);
        if(data.status.code == "10"){
        	fs.mkdirSync(config.channel_save_path+data.data.channel);
        	var filename = config.channel_save_path+data.data.channel+"\\"+now+".JSON";
        	var filecontext = data.data.result.data_list;
            fs.writeFile(filename, filecontext, "utf8", function(err) {
            	logger.info("error file : " + err);
            });
        }else{
        	logger.info(data);
        }
        console.log(data);
    }).catch(function (err){
    	logger.info("error sj04 : " + err);
    });
});    
function getData(){
    rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;

        sj01.invoke();
        sj02.invoke();
        sj03.invoke();
        sj04.invoke();
        
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
}

getData();

module.exports = getData;