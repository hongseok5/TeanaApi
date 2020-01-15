const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("if_dma_00003", winstonConfig.createLoggerConfig("if_dma_00003"));
var logger = winston.loggers.get("if_dma_00003");
/*//개발
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
    uri: 'https://ssgtv--partsb.my.salesforce.com/services/apexrest/IF_STCS_DMA_00003',
    headers: {
        Authorization : null
    },
    timeout: 10000,
    body : ""
};*/
//운영
var options1 = {
    method: 'POST',
    uri: 'https://ssgtv.my.salesforce.com/services/oauth2/token',
    form: {
        // Like <input type="text" name="name">
        grant_type:"password",
        client_id:"3MVG9G9pzCUSkzZtVB4GJTSLCTQkd603oOXC8D_P3pSbY7HDNQiqwXGhC2nWLBshnTVLtA2Xb585GhATB82XY",
        client_secret:"3462DFDEA0ED1EE5358C67EFE599CF7976D1662B93A51AE6F5C91D27CCD904D1",
        username : "ifuser@shinsegae.com",
        password : "demo123!"
    },
    headers: {},
    timeout: 5000
};

var options2 = {
    method: 'POST',
    uri: 'https://ssgtv.my.salesforce.com/services/apexrest/IF_STCS_DMA_00004',
    headers: {
        Authorization : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};
//var channel_codes = ["01", "02", "03", "04"];

var sj01 = schedule.scheduleJob('30 30 * * * *', function(){
	rp(options1)
    .then( function(body) {
    	var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj01 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "01" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
        	data = JSON.parse(data);
        	console.log("bchm 01 main = "+JSON.stringify(data));
        	if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
                	var filecontext = JSON.stringify(data.data.result.data_list[i]);
                	/*console.log("bchm 01 filename = "+filename);
                	console.log("bchm 01 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj01 : " + err);
        });
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
	
});    
var sj02 = schedule.scheduleJob('20 30 * * * *', function(){
	rp(options1)
    .then( function(body) {
    	var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj02 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "02" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};  
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
        	data = JSON.parse(data);
        	console.log("bchm 02 main = "+JSON.stringify(data));
        	if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
        			var filecontext = JSON.stringify(data.data.result.data_list[i]);
        			/*console.log("bchm 02 filename = "+filename);
                	console.log("bchm 02 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj02 : " + err);
        });
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
	
});    
var sj03 = schedule.scheduleJob('10 30 * * * *', function(){
	rp(options1)
    .then( function(body) {
    	var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj03 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "03" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
        	data = JSON.parse(data);
        	console.log("bchm 03 main = "+JSON.stringify(data));
        	if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
        			var filecontext = JSON.stringify(data.data.result.data_list[i]);
        			/*console.log("bchm 03 filename = "+filename);
                	console.log("bchm 03 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj03 : " + err);
        });
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
    
});    
var sj04 = schedule.scheduleJob('0 30 * * * *', function(){
    rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj04 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "04" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
            data = JSON.parse(data);
            console.log("bchm 04 main = "+JSON.stringify(data));
            if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
        			var filecontext = JSON.stringify(data.data.result.data_list[i]);
        			/*console.log("bchm 04 filename = "+filename);
                	console.log("bchm 04 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj04 : " + err);
        });
        
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
    
}); 
var sj05 = schedule.scheduleJob('0 30 * * * *', function(){
    rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj05 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "05" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
            data = JSON.parse(data);
            console.log("bchm 05 main = "+JSON.stringify(data));
            if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
        			var filecontext = JSON.stringify(data.data.result.data_list[i]);
        			/*console.log("bchm 05 filename = "+filename);
                	console.log("bchm 05 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj05 : " + err);
        });
        
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
    
}); 
var sj06 = schedule.scheduleJob('0 30 * * * *', function(){
    rp(options1)
    .then( function(body) {

        var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
        console.log("sj06 start");
        var now = dateFormat(new Date(), "yyyymmddHHMMss");
        param = { "standardTime": now , "channel" : "06" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        rp(options2)
        .then(function ( data ){
            data = JSON.parse(data);
            console.log("bchm 06 main = "+JSON.stringify(data));
            if(data.status.code == "00" || data.status.code == "10"){
        		!fs.existsSync(config.channel_save_path) && fs.mkdirSync(config.channel_save_path);
        		!fs.existsSync(config.channel_save_path+data.data.channel) && fs.mkdirSync(config.channel_save_path+data.data.channel);
        		for(i in data.data.result.data_list){
        			var filename = config.channel_save_path+data.data.channel+"\\"+data.data.result.data_list[i].no+".JSON";
        			var filecontext = JSON.stringify(data.data.result.data_list[i]);
        			/*console.log("bchm 06 filename = "+filename);
                	console.log("bchm 06 filecontext = "+filecontext);*/
                	logger.info("file write : " +filecontext);
                    fs.writeFile(filename, filecontext, "utf8", function(err) {
                    	if(err){
                			logger.error("file write error : " +err);
                		}
                    });
        		}
            }else{
            	logger.info(data);
            }
            console.log(data);
        }).catch(function (err){
        	logger.info("error sj06 : " + err);
        });
        
    })
    .catch(function (err) {
        console.error("error 1 : " + err);
    });
    
}); 
function getData(){
    sj01.invoke();
    sj02.invoke();
    sj03.invoke();
    sj04.invoke();
    sj05.invoke();
    sj06.invoke();
    
}

getData();

module.exports = getData;