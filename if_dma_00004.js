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
/*//운영
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
*/

function getData(){
	var path = config.send_save_path;
    var sj = schedule.scheduleJob('30 * * * * *', function(){
	    var send_data = {};
	    send_data.param = [];
	    !fs.existsSync(config.sent_save_path) && fs.mkdirSync(config.sent_save_path);
	    !fs.existsSync(config.sent_smry_path) && fs.mkdirSync(config.sent_smry_path);
	    var z = 0;
	    pool.getConnection(function(err, connection){
	    	fs.readdir(config.send_smry_path, function(err, filelist){
	        	filelist.forEach(function(file) {
	        		fs.readFile(config.send_smry_path+file , 'utf-8' , function(err , filedata){
	        			if(err) { return callerror(err); }
	        			try{
	        				filedata = JSON.parse(filedata);
	        			}catch(e){
	        				logger.error(e);
	        			}
	        			var querystring  = "update ua_call set category1 = lpad(?, 10, '0'), summary = ? where start_time = ? and extension = ?";
	        			
	        			var callSQLquery = connection.query(querystring, [ filedata.category, filedata.summary, filedata.startTime, filedata.extension ], function (err, rows) {
	        				if(err){
					        	connection.release();
					            throw err;
					        }else{
					        	logger.info("if_dma_00004_Db_Query_callSQLquery ifID: " + filedata.startTime + "-" + filedata.agentId);
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
					        //z = parseInt(z)+1;
					        //send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
				        	fs.rename(config.send_smry_path+file, config.sent_smry_path+file, callback);
					    });
					});
	    		});
	    		
	    	});
			connection.release();
	    });
    });  
    sj.invoke();
    
    var sj2 = schedule.scheduleJob('20 * * * * *', function(){
		!fs.existsSync(config.sent_save_path) && fs.mkdirSync(config.sent_save_path);
    	!fs.existsSync(config.send_error_path) && fs.mkdirSync(config.send_error_path);
        var z = 0;
        fs.readdir(config.send_save_path, function(err, filelist){
        	filelist.forEach(function(file) {
        		fs.readFile(config.send_save_path+file , 'utf-8' , function(err , filedata){
        			if(err) { return callerror(err); }
        			var send_data = {};
        	        send_data.param = [];
        	        try{
        	        	filedata = JSON.parse(filedata);
        	        }catch(e){
        	        	logger.error(e);
        	        }
        			send_data.param.push(filedata);
        			send_data.sendTime = dateFormat(new Date(), "yyyymmddHHMMss");
        			rp(options1)
        	        .then(function (body) {
        	            var token = JSON.parse(body);
        	            options2.headers.Authorization = "OAuth " + token.access_token;
        	            try{
        	            	req_body = JSON.stringify(send_data);
            	        }catch(e){
            	        	logger.error(e);
            	        }
        	            console.log(req_body);
        	            options2.body = req_body;
        	            
        	            rp(options2).then(function ( data ){
        	            	z = parseInt(z)+1;
        	            	try{
        	            		data = JSON.parse(data);
                	        }catch(e){
                	        	logger.error(e);
                	        }
        	            	if(data.code == "10"){
        	            		fs.rename(config.send_save_path+file, config.sent_save_path+file, callback);
								logger.info("if_dma_00004 file send success ifID: " + filedata.startTime + "-" + filedata.agentId);
        	            	}else if(data.code == "99"){
        	            		fs.rename(config.send_save_path+file, config.send_error_path+file, callback);
								logger.info("if_dma_00004 file send failed ifID: " + + filedata.startTime + "-" + filedata.agentId);
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