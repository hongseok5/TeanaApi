const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var common = require(approot + '/routes/common');
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
    uri: 'http://10.253.42.185:12800/voc/evaluation/_sync',
    headers: {
        Authorization : null
    },
    timeout: 10000,
    body : {
    	
    }
};
//var channel_codes = ["01", "02", "03", "04"];

var sj01 = schedule.scheduleJob('30 30 * * * *', function(){
    console.log("sj01 start");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    param = { "id" : "eval1",
    		"extradata" : "name = 01, dpet = 01",
    		"use" : "true",
    		"expression" :    [{
    	    		"id" : "s1",
    	    		"extradata" : "type = aaaa",
    	    		"use" : "true",
    	    		"expression" :"안녕하십니까? 행복을 전하는 신세계 홈쇼핑 ${NAME]입니다.",
    	    		"synonyms" : [{
    	    			"use" : "true",
    	    			"experssion" : "안녕하십니까? 행복을 전하는 신세계 홈쇼핑 ${NAME]입니다."
    	    		},{
    	    			"use" : "true",
    	    			"experssion" : "안녕하십니까? 행복을 전하는 신세계 ${NAME]입니다."
    	    		}]
    	    	},
    	    	{
    	    		"id" : "s2",
    	        	"extradata" : "type = bbbbb",
    	        	"use" : "true",
    	        	"expression" :"안녕하십니까? 행복을 전하는 신세계 홈쇼핑 ${NAME]입니다.",
    	        	"synonyms" : [{
    	        		"use" : "true",
    	        		"experssion" : "안녕하십니까? 행복을 전하는 신세계 홈쇼핑 ${NAME]입니다."
    	        	},{
    	        		"use" : "true",
    	        		"experssion" : "안녕하십니까? 행복을 전하는 신세계 ${NAME]입니다."
    	        	}]	
    	    	}]};
    options2.body = JSON.stringify(param);
    console.log("sj01 2 "+options2.body);
    rp(options2).then(function ( data ){
    	console.log(data);
    	data = JSON.parse(data);
    	console.log(data);
    }).catch(function (err){
    	logger.info("error sj01 : " + err);
    });
});    
  
function getData(){
    sj01.invoke();
	
    rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;

        
    })
    
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
}

getData();

module.exports = getData;