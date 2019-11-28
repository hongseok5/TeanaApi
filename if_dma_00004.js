const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
const fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("if_dma_00004", winstonConfig.createLoggerConfig("if_dma_00004"));
var logger = winston.loggers.get("if_dma_00004");

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
    var path = config.send_save_path;
    var sj = schedule.scheduleJob('*/10 * * * * *', function(){
    	var send_data = {};
        send_data.params = [];

        fs.readdir(config.send_save_path, function(err, filelist){
        	filelist.forEach(function(file) {
        		fs.readFile(config.send_save_path+file , 'utf-8' , function(err , filedata){
        			send_data.params.push(filedata);
        		});
        		fs.unlink(config.send_save_path+file, function(err){
	    	        if( err ) throw err;
	    	        console.log('file deleted');
	    	    });
        	});
        	
        });
        send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
        !fs.existsSync(config.sent_save_path+send_data.sendTime) && fs.mkdirSync(config.sent_save_path+send_data.sendTime);
        var filename = config.sent_save_path+send_data.sendTime;
    	var filecontext = send_data;
        fs.writeFile(filename, filecontext, "utf8", function(err) {
        	logger.info("error file : " + err);
        });
    	
        rp(options1)
        .then(function (body) {
            var token = JSON.parse(body);
            options2.headers.Authorization = "OAuth " + token.access_token;
            req_body = JSON.stringify(send_data);
            console.log(req_body);
            options2.body = req_body;
            rp(options2).then(function ( data ){
                logger.info(data);
            }).catch(function (err){
            	logger.error(err);
            });
        })
        .catch(function (err) {
        	logger.error(err);
        });
    });  
    sj.invoke();
}

//getData();
module.exports = getData;