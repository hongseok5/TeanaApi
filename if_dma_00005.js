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
    uri: 'https://ssgtv--partsb.my.salesforce.com/services/oauth2/token',
    form: {
        // Like <input type="text" name="name">
        grant_type:"password",
        client_id:"3MVG9Se4BnchkASkQ7erk2gSAZhcOZsQ5dA_fiSayiTrS84FO_EeCoBTENS8jia3BJLTybfrf0qM6NrpX2ycV",
        client_secret:"D75E3D5A9951A4DA476781732F620E8605D1F99FD56BE829C7B6C55D9E99F4B2",
        username : "ifuser@shinsegae.com.partsb",
        password : "demo123!"
    },
    headers: {},
    timeout: 5000
};

var options2 = {
    method: 'POST',
    uri: 'https://ssgtv--partsb.my.salesforce.com/services/apexrest/IF_STCS_DMA_00005',
    headers: {
        "Authorization" : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};


var io = schedule.scheduleJob('0 30 3 * * *', function(){
	logger.info("if_dma_00005 start");
	
	!fs.existsSync(config.file_ready) && fs.mkdirSync(config.file_ready);
	rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "01" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2).then(function ( data ){
        	data = JSON.parse(data);
        	console.log('data = '+JSON.stringify(data));
        	for(i in data.data.result.data_list){
        		if(data.data.result.data_list[i].duration > tempsecond){
        			var filename = config.file_ready+"\\"+data.data.result.data_list[i].startTime+"-"+data.data.result.data_list[i].ctiId+"-T";
                	var filecontext = JSON.stringify(data.data.result.data_list[i]);
					logger.info("file write : " +filename);
                	fs.writeFile(filename, filecontext, "utf8", function(err) {
                		if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
        	}
        });
        
    })
	
	logger.info("if_dma_00005_End");
}); 

function getData(){
	io.invoke();
}
getData();

module.exports = getData;