const rp = require('request-promise');
const schedule = require('node-schedule');
const dateFormat = require('dateformat');
const winston = require('winston');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var crypto = require(approot + '/lib/crypto');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("if_uanalzyer", winstonConfig.createLoggerConfig("if_uanalzyer"));
var logger = winston.loggers.get("if_uanalzyer");
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

var options1 = {
	method: 'POST',
	uri: 'http://10.253.42.185:12800/voc/evaluation/_match',
	headers: {
	    Authorization : null,
	    "content-type" : "application/json"
	},
	timeout: 10000,
	body : {
	  	
	}
};

var io = schedule.scheduleJob('*/30 * * * * *', function(){
	logger.info("if_uanalzyer_Start");
	var tempdate = dateFormat(new Date(), "yyyymmddHHMMss");
	var tempfolder = config.backup_path_bak+tempdate+"_temp\\";
	
	!fs.existsSync(tempfolder) && fs.mkdirSync(tempfolder);
	!fs.existsSync(config.backup_path_bak) && fs.mkdirSync(config.backup_path_bak);
	!fs.existsSync(config.backup_path_error) && fs.mkdirSync(config.backup_path_error);
	
	fs.readdir(config.backup_path, function(err, filetemplist){
		filetemplist.forEach(function(filetemp) {
			if(filetemp.substring(filetemp.lastIndexOf("-"),filetemp.length) == '-R' || filetemp.substring(filetemp.lastIndexOf("-"),filetemp.length) == '-T'){
				fs.rename(config.backup_path+filetemp, tempfolder+filetemp, callback);
			}
		});
		pool.getConnection(function(err, connection){
			fs.readdir(tempfolder, function(err, filelist){
				console.log('file readdir'); 
				if(err) { return callerror(err); }
				filelist.forEach(function(file) {
					console.log('file forEach');
					if(file.substring(file.lastIndexOf("-"),file.length) == '-T'){
						fs.readFile(tempfolder+file , 'utf-8' , function(err , filedata){
							if(err) { return callerror(err); }
							filedata = JSON.parse(filedata);
							var counsetltypeid = "";
							var callsetseq = "";

							console.log('file pool.getConnection');
							var querystring  = "SELECT NCT.COUNSEL_TYPE_ID, (SELECT CURRENT_VAL FROM NX_SEQUENCE WHERE SEQUENCE_ID = 'CALL_SET_SEQ'  LIMIT 1) AS SEQ FROM NX_COUNSEL_TYPE_MAPPING NCT, NX_EMP NE WHERE NCT.DEPT_ID = NE.DEPT_ID AND NE.CTI_ID = ? LIMIT 1";
							connection.query(querystring, [ filedata.agentId ], function(err, rows, fields) {
								console.log('db querystring');
								if (!err){
									for(var i=0; i<rows.length;i++){
								    	counsetltypeid = rows[i].COUNSEL_TYPE_ID; //resultId에 해당하는 부분만 가져옴
								    	callsetseq = rows[i].SEQ; //resultId에 해당하는 부분만 가져옴
								    }
									if(counsetltypeid != null || counsetltypeid != ""){
										var filedataset = filedata.timeNtalk.replace(/[0-9]/g, "");
										param = { "id" : counsetltypeid,
									    		  "text" : filedataset.replace(/ /gi, "")
									    		};
												
										logger.debug("counsetltypeid : " +counsetltypeid);		
												
									    options1.body = JSON.stringify(param);
									    rp(options1).then(function ( data ){
									    	console.log('db rp(options1)');
									    	var callSQL = "CALL call_counsel_set(?, ?, ?, ?)";
									    	var inserEstDtlHisSQL = "  INSERT INTO NX_COUNSEL_ITEM_HIS (CALL_SET_SEQ, START_TIME, EXTENSION, COUNSEL_TYPE_ID, EMP_ID  "
													    		+", DEPT_ID, LEV3_COUNSEL_ITEM_ID, LEV4_COUNSEL_ITEM_ID, LEV3_ITEM_POINT, LEV4_ITEM_POINT "
													    		+", ITEM_COUNT, ITEM_TYPE_CD, REG_ID, REG_IP, REG_DTM, MOD_ID, MOD_IP, MOD_DTM) "
													    		+"select ?, ?, ?, ?, emp_id, dept_id, ?, ?, ?, ?, ?, ?, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate() from NX_EMP where cti_id=? ";

									    	console.log('db data'+data);
									    	data = JSON.parse(data);
									    	console.log('db data.matches'+data.matches.length);
									    	if(data.matches.length == 0){
									    		var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.agentId ], function (err, rows) {
								    	    		if(err){
								    	    			logger.error("if_uanalzyer_Db_Query_db callSQLquery", err);
										    	    }else{
										    	    	logger.info("if_uanalzyer_Db_Query_callSQL", err);
													}
										    	    connection.commit(function(err){
										    	        if(err){
										    	            connection.rollback(function(err){
										    	            	logger.error("if_uanalzyer_Db_Query_db callSQLquery_rollback", err);
										    	            });
										    	        } else {
										    	            console.log("Updated successfully!");
										    	        }
										    	    });
										    	    fs.rename(tempfolder+file, config.backup_path_bak+file, callback);
										    	    /*fs.unlink(config.backup_path+file, function(err){
										    	        if( err ) throw err;
										    	        console.log('file deleted');
										    	    });*/
										    	});
									    	}
									    	for(i in data.matches){
									    		console.log('db data.matches');
									    		var extrarr = data.matches[i].extradata.split(","); 
									    		var counselitemid4 = extrarr[2].substring(extrarr[2].lastIndexOf("=")+1, extrarr[2].length);
									    		var counselitemid3 = extrarr[1].substring(extrarr[1].lastIndexOf("=")+1, extrarr[1].length);
									    		var lev4itempoint = extrarr[0].substring(extrarr[0].lastIndexOf("=")+1, extrarr[0].length);
									    		var lev3itempoint = extrarr[3].substring(extrarr[3].lastIndexOf("=")+1, extrarr[3].length);
									    		var itemtypecd = extrarr[4].substring(extrarr[4].lastIndexOf("=")+1, extrarr[4].length);
									    		var checkrow = data.matches.length-1;
									    		var inserEstDtlquery = connection.query(inserEstDtlHisSQL, [ callsetseq, filedata.startTime, filedata.extension, data.id, counselitemid3, counselitemid4, lev3itempoint, lev4itempoint, data.matches[i].frequency, itemtypecd, filedata.agentId ], function (err, rows) {
									    			console.log('db callsetseq');
									    			if(err){
									    				fs.rename(tempfolder+file, config.backup_path_error+file, callback);
									    			 	logger.error("if_uanalzyer_Db_Query_db callsetseq", err);
										    	    }else{
										    	    	logger.info("if_uanalzyer_Db_Query_inserEstDtltQL", err);
													}
										    	    connection.commit(function(err){
										    	        if(err){
										    	        	fs.rename(tempfolder+file, config.backup_path_error+file, callback);
										    	            connection.rollback(function(err){
										    	            	logger.error("if_uanalzyer_Db_Query_db callsetseq_rollback", err);
										    	            });
										    	        } else {
										    	            console.log("Updated successfully!");
										    	            if(i == checkrow){
										    	            	var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.agentId ], function (err, rows) {
												    	    		if(err){
												    	    			fs.rename(tempfolder+file, config.backup_path_error+file, callback);
														    	    	logger.error("if_uanalzyer_Db_Query_callSQL", err);
														    	    }else{
														    	    	logger.info("if_uanalzyer_Db_Query_callSQL", err);
																	}
														    	    connection.commit(function(err){
														    	        if(err){
														    	        	fs.rename(tempfolder+file, config.backup_path_error+file, callback);
														    	            connection.rollback(function(err){
														    	            	logger.error("if_uanalzyer_Db_Query_callSQL_rollback", err);
														    	            });
														    	        } else {
														    	            console.log("Updated successfully!");
														    	        }
														    	    });
														    	    fs.rename(tempfolder+file, config.backup_path_bak+file, callback);
														    	    /*fs.unlink(config.backup_path+file, function(err){
														    	        if( err ) throw err;
														    	        console.log('file deleted');
														    	    });*/
														    	});
												    	    }
										    	        }
										    	    });
										    	    
										    	    //connection.release();
										    	});
									    	}
										}).catch(function (err){
											fs.rename(tempfolder+file, config.backup_path_error+file, callback);
											logger.error("if_uanalzyer_/voc/evaluation/_match", err);
									    });
									}else{
										fs.rename(tempfolder+file, config.backup_path_error+file, callback);
										logger.error("if_uanalzyer_COUNSEL_TYPE_ID_null", err);
									}
								}
								else{
									fs.rename(tempfolder+file, config.backup_path_error+file, callback);
									logger.error("if_uanalzyer_Db_Query_2", err);
								}
									
							});
							
							
						});
					}else{
						if(file.substring(file.lastIndexOf("-"),file.length) == '-R'){
							fs.rename(tempfolder+file, config.backup_path_bak+file, callback);
							/*fs.unlink(config.backup_path+file, function(err){
				    	        if( err ){
				    	        	throw err;
				    	        }
				    	        console.log('file deleted');
				    	    });*/
						}
					}
			    });
			});
			//커넥션 반환.
			connection.release();
		});
	});
	
	logger.info("if_uanalzyer_End");
}); 

var folderdelete = schedule.scheduleJob('0 30 9 * * *', function(){
	/*
	var tempdate = dateFormat(new Date(), "yyyymmddHHMMss");
	var day_ago = new Date().getDate() - 1 ;
	day_ago = tempdate.slice(0,6) + ( day_ago < 8 ? "0" + day_ago : day_ago );
    */
	var tempdate = dateFormat(new Date(), "yyyymmddHHMMss");
    var day_ago = new Date().getHours() - 1 ;
    day_ago = tempdate.slice(0,8) + ( day_ago < 10 ? "0" + day_ago : day_ago );
    
	fs.readdirSync(config.backup_path_bak).forEach(function(file, index){
		if(file.substring(0,10) == day_ago){
			if(file.substring(file.lastIndexOf("_"),file.length) == '_temp'){
				fs.rmdirSync(config.backup_path_bak+file);
			}
		}
	});
	
});

function callback(){
	console.log("file remove susscces");
}

function callerror(err){
	logger.error("if_uanalzyer_file_error", err);
}

function getData(){
	io.invoke();
	folderdelete.invoke();
}
getData();

module.exports = getData;