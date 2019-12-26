const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var crypto = require(approot + '/lib/crypto');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("if_evaluation", winstonConfig.createLoggerConfig("if_evaluation"));
var logger = winston.loggers.get("if_evaluation");
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

var options = {
    method: 'POST',
    uri: 'http://10.253.42.122:12800/voc/evaluation/_sync',
    headers: {
        Authorization : null,
        "content-type" : "application/json"
    },
    timeout: 10000,
    body : {
    	
    }
};

var iu = schedule.scheduleJob('0 10 3 * * *', function(){
	//console.log('bchm'); 
	var deletehis = " delete from nx_counsel_item_his ";
	var deletedtl = " delete from ua_call_est_dtl ";
	var deleteest = " delete from ua_call_est ";  
	pool.getConnection(function(err, connection){
		connection.query(deletehis, function (err, rows) {
    		if(err){
    			logger.error("if_uanalzyer_Db_Query_deletehis", err);
    	    }else{
    	    	logger.info("if_uanalzyer_Db_Query_deletehis", err);
			}
    	    connection.commit(function(err){
    	        if(err){
    	        	connection.rollback(function(err){
    	            	logger.error("if_uanalzyer_Db_Query_deletehis_rollback", err);
    	            });
    	        } else {
    	            console.log("Updated successfully!");
    	        }
    	    });
    	});
		
		connection.query(deletedtl, function (err, rows) {
    		if(err){
    			logger.error("if_uanalzyer_Db_Query_deletedtl", err);
    	    }else{
    	    	logger.info("if_uanalzyer_Db_Query_deletedtl", err);
			}
    	    connection.commit(function(err){
    	        if(err){
    	        	connection.rollback(function(err){
    	            	logger.error("if_uanalzyer_Db_Query_deletedtl_rollback", err);
    	            });
    	        } else {
    	            console.log("Updated successfully!");
    	        }
    	    });
    	});
		
		connection.query(deleteest, function (err, rows) {
    		if(err){
    			logger.error("if_uanalzyer_Db_Query_deleteest", err);
    	    }else{
    	    	logger.info("if_uanalzyer_Db_Query_deleteest", err);
			}
    	    connection.commit(function(err){
    	        if(err){
    	        	connection.rollback(function(err){
    	            	logger.error("if_uanalzyer_Db_Query_deleteest_rollback", err);
    	            });
    	        } else {
    	            console.log("Updated successfully!");
    	        }
    	    });
    	});
		//커넥션 반환.
		connection.release();
	});
}); 

function getData(){
	
	iu.invoke();
	
}

getData();

module.exports = getData;