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
    host : '10.253.42.121',
    user : 'ssgtv',
    password : 'af6676387824a0ee9bbae73e3da0671e',
    database : 'ssgtv',
    connectionLimit : 5
};

conn.password = crypto.strdecrypto(conn.password);


var pool = mariadb.createPool(conn);

var options1 = {
	method: 'POST',
	uri: 'http://10.253.42.122:12800/voc/evaluation/_match',
	headers: {
	    Authorization : null,
	    "content-type" : "application/json"
	},
	timeout: 10000,
	body : {
	  	
	}
};

var io = schedule.scheduleJob('0 30 3 * * *', function(){
	logger.info("if_uanalzyer_Start");
	
	!fs.existsSync(config.file_ready_bak) && fs.mkdirSync(config.file_ready_bak);
	!fs.existsSync(config.file_ready_error) && fs.mkdirSync(config.file_ready_error);
	
	pool.getConnection(function(err, connection){
		fs.readdir(config.file_ready, function(err, filelist){
			console.log('file readdir'); 
			if(err) { return callerror(err); }
			filelist.forEach(function(file) {
				console.log('file forEach');
				if(file.substring(file.lastIndexOf("-"),file.length) == '-T'){
					fs.readFile(config.file_ready+file , 'utf-8' , function(err , filedata){
						if(err) { return callerror(err); }
						filedata = JSON.parse(filedata);
						var counsetltypeid = "";
						var callsetseq = "";
						console.log('file pool.getConnection');
						var querystring  = "select case when nd.est_target_yn = 'Y' " 
										 + "then (select counsel_type_id from nx_counsel_type_mapping nctm where nctm.dept_id = nd.dept_id) "
										 +"else (select counsel_type_id from nx_counsel_type_mapping nctm where nctm.call_type_id = ?) end as counsel_type_id, "
										 +"(select current_val from nx_sequence where sequence_id = 'CALL_SET_SEQ'  limit 1) as seq "
										 +"from nx_dept nd, nx_emp ne "
										 +"where nd.dept_id = ne.dept_id "
										 +"and nd.est_yn = 'Y' "
										 +"and nd.direction = ? "
										 +"and ne.cti_id = ? ";
						var querystring2  = "select talk_content from ua_talk  where start_time=? and extension = ? and trans_type = 'T' "; 
						var updateSequence  = "update nx_sequence set current_val = ? where sequence_id = 'CALL_SET_SEQ'";
						connection.query(querystring, [ filedata.inCate,filedata.direction,filedata.ctiId ], function(err, rows, fields) {
							console.log('db querystring');
							if (!err){
								if(rows == null){
									fs.rename(config.file_ready+file, config.file_ready_bak+file, callback);
				    			 	logger.info("if_uanalzyer_Db_Query_db counsel_type_id_null_"+file);
								}else{
									for(var i in rows){
								    	counsetltypeid = rows[i].counsel_type_id; //resultId에 해당하는 부분만 가져옴
								    	callsetseq = rows[i].seq; //resultId에 해당하는 부분만 가져옴
								    }
									var updateCnt = parseInt(callsetseq)+1;
									connection.query(updateSequence, [ updateCnt ], function (err, rows) {
					    	    		if(err){
					    	    			logger.error("if_uanalzyer_Db_Query_updateCurrent", err);
							    	    }else{
							    	    	logger.info("if_uanalzyer_Db_Query_updateCurrent", err);
										}
							    	    connection.commit(function(err){
							    	        if(err){
							    	        	connection.rollback(function(err){
							    	            	logger.error("if_uanalzyer_Db_Query_updateCurrent_rollback", err);
							    	            });
							    	        } else {
							    	            console.log("Updated successfully!");
							    	        }
							    	    });
							    	});
									if(counsetltypeid != null || counsetltypeid != ""){
										connection.query(querystring2, [ filedata.startTime,filedata.extension ], function(err, rows, fields) {
											var context_text = "";
											for(z in rows){
												context_text = context_text+"\n\t"+rows[z].talk_content;
											}
											var filedataset = context_text.replace(/[0-9]/g, "");
											param = { "id" : counsetltypeid,
										    		  "text" : filedataset.replace(/ /gi, "")
										    		};
													
											logger.debug("counsetltypeid : " +counsetltypeid);		
													
										    options1.body = JSON.stringify(param);
										    rp(options1).then(function ( data ){
										    	console.log('db rp(options1)');
										    	var callSQL = "call call_counsel_set(?, ?, ?, ?, ?)";
										    	var inserEstDtlHisSQL = "  insert into nx_counsel_item_his (call_set_seq, start_time, extension, counsel_type_id, emp_id  "
														    		+", dept_id, lev3_counsel_item_id, lev4_counsel_item_id, lev3_item_point, lev4_item_point "
														    		+", item_count, item_type_cd, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) "
														    		+"select ?, ?, ?, ?, emp_id, dept_id, ?, ?, ?, ?, ?, ?, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate() from nx_emp where cti_id=? ";

										    	console.log('db data'+data);
										    	data = JSON.parse(data);
										    	console.log('db data.matches'+data.matches.length);
										    	if(data.matches.length == 0){
										    		var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.ctiId, counsetltypeid ], function (err, rows) {
									    	    		if(err){
									    	    			logger.error("if_uanalzyer_Db_Query_db callSQLquery", err);
											    	    }else{
											    	    	logger.info("if_uanalzyer_Db_Query_callSQL bchm1", err);
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
											    	    // bchm 파일 이관
											    	    fs.rename(config.file_ready+file, config.file_ready_bak+file, callback);
											    	});
										    	}
										    	var checklev3item = "";
										    	for(i in data.matches){
										    		console.log('db data.matches');
										    		var extrarr = data.matches[i].extradata.split(","); 
										    		var counselitemid4 = extrarr[2].substring(extrarr[2].lastIndexOf("=")+1, extrarr[2].length);
										    		var counselitemid3 = extrarr[1].substring(extrarr[1].lastIndexOf("=")+1, extrarr[1].length);
										    		var lev4itempoint = extrarr[0].substring(extrarr[0].lastIndexOf("=")+1, extrarr[0].length);
										    		var lev3itempoint = extrarr[3].substring(extrarr[3].lastIndexOf("=")+1, extrarr[3].length);
										    		var itemtypecd = extrarr[4].substring(extrarr[4].lastIndexOf("=")+1, extrarr[4].length);
										    		var checkrow = data.matches.length-1;
										    		var inserEstDtlquery = connection.query(inserEstDtlHisSQL, [ callsetseq, filedata.startTime, filedata.extension, data.id, counselitemid3, counselitemid4, lev3itempoint, lev4itempoint, data.matches[i].frequency, itemtypecd, filedata.ctiId ], function (err, rows) {
										    			console.log('db callsetseq');
										    			if(err){
										    				fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
										    			 	logger.error("if_uanalzyer_Db_Query_db callsetseq", err);
											    	    }else{
											    	    	logger.info("if_uanalzyer_Db_Query_inserEstDtltQL", err);
														}
										    			if(checklev3item != lev3itempoint){
										    				checklev3item = lev3itempoint;
										    				connection.commit(function(err){
												    	        if(err){
												    	        	fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
												    	            connection.rollback(function(err){
												    	            	logger.error("if_uanalzyer_Db_Query_db callsetseq_rollback", err);
												    	            });
												    	        } else {
												    	            console.log("Updated successfully!");
												    	            if(i == checkrow){
												    	            	var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.ctiId, counsetltypeid ], function (err, rows) {
														    	    		if(err){
														    	    			fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
																    	    	logger.error("if_uanalzyer_Db_Query_callSQL", err);
																    	    }else{
																    	    	logger.info("if_uanalzyer_Db_Query_callSQL", err);
																			}
																    	    connection.commit(function(err){
																    	        if(err){
																    	        	fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
																    	            connection.rollback(function(err){
																    	            	logger.error("if_uanalzyer_Db_Query_callSQL_rollback", err);
																    	            });
																    	        } else {
																    	            console.log("Updated successfully!");
																    	        }
																    	    });
																    	    //bchm 파일 이관
																    	    fs.rename(config.file_ready+file, config.file_ready_bak+file, callback);
																    	});
														    	    }
												    	        }
												    	    });
										    			}
											    	});
										    	}
											}).catch(function (err){
												fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
												logger.error("if_uanalzyer_/voc/evaluation/_match", err);
										    });
										});
									}else{
										fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
										logger.error("if_uanalzyer_COUNSEL_TYPE_ID_null", err);
									}
								}
							}
							else{
								fs.rename(config.file_ready+file, config.file_ready_error+file, callback);
								logger.error("if_uanalzyer_Db_Query_2", err);
							}
								
						});
						
						
					});
				}else{
					if(file.substring(file.lastIndexOf("-"),file.length) == '-R'){
						fs.rename(config.file_ready+file, config.file_ready_bak+file, callback);
					}
				}
		    });
		});
		//커넥션 반환.
		connection.release();
	});
	
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