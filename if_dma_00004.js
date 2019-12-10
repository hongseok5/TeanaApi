const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
const fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var crypto = require(approot + '/lib/crypto');
const mariadb = require('mysql');
const conn = {
    host : '10.253.42.184',
    user : 'ssgtv',
    password : 'af6676387824a0ee9bbae73e3da0671e',
    database : 'ssgtv',
    connectionLimit : 5
};

conn.password = crypto.strdecrypto(conn.password);


var pool = mariadb.createPool(conn);
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
    var sj = schedule.scheduleJob('30 30 * * * *', function(){
	    var send_data = {};
	    send_data.params = [];
	    !fs.existsSync(config.sent_save_path) && fs.mkdirSync(config.sent_save_path);
	    var z = 0;
	    pool.getConnection(function(err, connection){
	    	fs.readdir(config.send_smry_path, function(err, filelist){
	        	filelist.forEach(function(file) {
	        		fs.readFile(config.send_smry_path+file , 'utf-8' , function(err , filedata){
	        			if(err) { return callerror(err); }
	        			filedata = JSON.parse(filedata);
	        			var querystring  = "UPDATE UA_CALL SET CATEGORY1 = LPAD(?, 10, '0'), SUMMARY = ? WHERE START_TIME = ? AND EXTENSION = ?";
	        			
	        			var callSQLquery = connection.query(querystring, [ filedata.category, filedata.summary, filedata.startTime, filedata.extension ], function (err, rows) {
	        				if(err){
					        	connection.release();
					            throw err;
					        }else{
					        	logger.info("if_dma_00004_Db_Query_callSQLquery", err);
							}
					        connection.commit(function(err){
					            if(err){
					                connection.rollback(function(err){
					                    throw err;
					                });
					            } else {
					                console.log("Updated successfully!");
					            }
					        });
					        z = parseInt(z)+1;
					        send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
				        	fs.rename(config.send_smry_path+file, config.sent_save_path+send_data.sendTime+z, callback);
					    });
					});
	    		});
	    		
	    	});
			connection.release();
	    });
    });  
    sj.invoke();
    var sj2 = schedule.scheduleJob('30 30 * * * *', function(){
    	!fs.existsSync(config.send_move_path) && fs.mkdirSync(config.send_move_path);
    	!fs.existsSync(config.send_error_path) && fs.mkdirSync(config.send_error_path);
        var z = 0;
        fs.readdir(config.send_save_path, function(err, filelist){
        	filelist.forEach(function(file) {
        		fs.readFile(config.send_save_path+file , 'utf-8' , function(err , filedata){
        			if(err) { return callerror(err); }
        			var send_data = {};
        	        send_data.params = [];
        	        filedata = JSON.parse(filedata);
        			send_data.params.push(filedata);
        			send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
        			rp(options1)
        	        .then(function (body) {
        	            var token = JSON.parse(body);
        	            options2.headers.Authorization = "OAuth " + token.access_token;
        	            req_body = JSON.stringify(send_data);
        	            console.log(req_body);
        	            options2.body = req_body;
        	            
        	            rp(options2).then(function ( data ){
        	            	z = parseInt(z)+1;
        	            	data = JSON.parse(data);
        	            	if(data.code == "10"){
        	            		fs.rename(config.send_save_path+file, config.send_move_path+send_data.sendTime+z, callback);
        	            	}else if(data.code == "99"){
        	            		fs.rename(config.send_save_path+file, config.send_error_path+send_data.sendTime+z, callback);
        	            	}
        	            }).catch(function (err){
        	            	logger.error(err);
        	            });
        	        })
        	        .catch(function (err) {
        	        	logger.error(err);
        	        });
        			
				});
    		});
    	});
        
    });  
    sj2.invoke();
}

function callback(){
	console.log('file remove!!');
}

function callerror(err){
	logger.error("if_dma_00004_Db_file_error", err);
	console.log('file error!! '+err);
}

getData();
module.exports = getData;