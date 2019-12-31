const rp = require('request-promise');
const schedule = require('node-schedule');
const dateFormat = require('dateformat');
const winston = require('winston');
//기준 초
const tempsecond = 60;
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var crypto = require(approot + '/lib/crypto');

/*******************************************************************************
 * 로그 설정.
 ******************************************************************************/
winston.loggers.add("if_dma_00005", winstonConfig.createLoggerConfig("if_dma_00005"));
var logger = winston.loggers.get("if_dma_00005");

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
    uri: 'https://ssgtv--partsb2.my.salesforce.com/services/apexrest/IF_STCS_DMA_00005',
    headers: {
        "Authorization" : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};


var io = schedule.scheduleJob('0 30 3 * * *', function(){
	logger.info("if_dma_00005 start");
	
	!fs.existsSync(config.backup_path_bak) && fs.mkdirSync(config.backup_path_bak);
	rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "01" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2).then(function ( data ){
        	for(i in data.data.result.data_list){
        		if(data.data.result.data_list[i].duration > tempsecond){
        			var filename = config.backup_path_bak+"\\"+now+"_"+i+"-T";
                	var filecontext = data.data.result.data_list[i];
                	fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	logger.info("error file : " + err);
                    });
        		}
        	}
        });
        
    })
	
	
	logger.info("if_uanalzyer_End");
}); 

function callback(){
	console.log("file remove susscces");
}

function callerror(err){
	logger.error("if_uanalzyer_file_error", err);
}

function getData(){
	io.invoke();
    
}
getData();

module.exports = getData;