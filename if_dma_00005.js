const rp = require('request-promise');
const schedule = require('node-schedule');
const dateFormat = require('dateformat');
const winston = require('winston');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var crypto = require(approot + '/lib/crypto');

/*******************************************************************************
 * 로그 설정.
 ******************************************************************************/
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


var io = schedule.scheduleJob('0 30 3 * * *', function(){
	logger.info("if_dma_00005 start");
	
	!fs.existsSync(config.backup_path_bak) && fs.mkdirSync(config.backup_path_bak);
	!fs.existsSync(config.backup_path_error) && fs.mkdirSync(config.backup_path_error);
	
	pool.getConnection(function(err, connection){
		var now = dateFormat(new Date(), "yyyymmddHHMMss");
	    param = { "standardTime": now , "channel" : "01" , clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
	    options2.body = JSON.stringify(param);
	    rp(options2).then(function ( data ){
	    	data = JSON.parse(data);
	    	if(data.status.code == "10"){
	    		var querystring  = "select nctm.counsel_type_id from nx_emp ne, nx_dept nd, nx_counsel_type_mapping nctm where ne.dept_id = nd.dept_id and nd.est_yn = 'Y' and nd.est_target_yn = 'Y' and ne.cti_id = ? and nctm.dept_id = nd.dept_id limit 1";
	    		var querystring2  = "select nctm.counsel_type_id from  nx_counsel_type_mapping nctm where nctm.call_type_id = ? limit 1";
	    		var querystring3  = "select talk_content from ua_talk ut, nx_emp ne where ut.start_time=? and ne.cti_id = ? and ne.extension = ut.extension and trans_type = 'T' ";
	    		var querystring4  = "select current_val from nx_sequence where sequence_id = 'CALL_SET_SEQ'  limit 1";
	    		var updateSequence  = "update nx_sequence set current_val = ? where sequence_id = 'CALL_SET_SEQ'";
	    		var current_val=0;
	    		var counsetltypeid="";
	    		for(i in data.result.data_list){
	    			connection.query(querystring, [ data.result.data_list[i].ctiId ], function(err, rows, fields) {
	    				console.log('db querystring');
						if (!err){
							for(var i=0; i<rows.length;i++){
						    	counsetltypeid = rows[i].counsel_type_id; // resultId에
							}
							if(counsetltypeid == ""){
								connection.query(querystring2, [ data.result.data_list[i].inCate ], function(err, rows, fields) {
									if (!err){
										for(var i=0; i<rows.length;i++){
									    	counsetltypeid = rows[i].counsel_type_id; // resultId에
										}
										//bchm else
										if(counsetltypeid != null || counsetltypeid != ""){
											connection.query(querystring3, [ data.result.data_list[i].startTime, data.result.data_list[i].ctiId ], function(err, rows, fields) {
												var content_text="";
												for(var i=0; i<rows.length;i++){
													content_text = content_text+rows[i].talk_content;
												}
												connection.query(querystring4, function(err, rows, fields) {
													for(var i=0; i<rows.length;i++){
														current_val = rows[i].current_val;
													}
													var updateCnt = parseInt(current_val)+1;
													connection.query(updateSequence, [ updateCnt ], function (err, rows) {
									    	    		if(err){
									    	    			logger.error("if_dma_00005_Db_Query_updateCurrent", err);
											    	    }else{
											    	    	logger.info("if_dma_00005_Db_Query_updateCurrent", err);
														}
											    	    connection.commit(function(err){
											    	        if(err){
											    	        	connection.rollback(function(err){
											    	            	logger.error("if_dma_00005_Db_Query_updateCurrent_rollback", err);
											    	            });
											    	        } else {
											    	            console.log("Updated successfully!");
											    	        }
											    	    });
											    	});

													var content_text = content_text.replace(/[0-9]/g, "");
													param = { "id" : counsetltypeid,
												    		  "text" : content_text.replace(/ /gi, "")
												    		};
															
													logger.debug("counsetltypeid : " +counsetltypeid);		
															
												    options1.body = JSON.stringify(param);
												    rp(options1).then(function ( data ){
												    	console.log('db rp(options1)');
												    	var callSQL = "call call_counsel_set(?, ?, ?, ?)";
												    	var inserEstDtlHisSQL = "  insert into nx_counsel_item_his (call_set_seq, start_time, extension, counsel_type_id, emp_id  "
																    		+", dept_id, lev3_counsel_item_id, lev4_counsel_item_id, lev3_item_point, lev4_item_point "
																    		+", item_count, item_type_cd, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) "
																    		+"select ?, ?, ?, ?, emp_id, dept_id, ?, ?, ?, ?, ?, ?, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate() from nx_emp where cti_id=? ";

												    	console.log('db data'+data);
												    	data = JSON.parse(data);
												    	console.log('db data.matches'+data.matches.length);
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
												    		var inserEstDtlquery = connection.query(inserEstDtlHisSQL, [ callsetseq, filedata.startTime, filedata.extension, data.id, counselitemid3, counselitemid4, lev3itempoint, lev4itempoint, data.matches[i].frequency, itemtypecd, filedata.agentId ], function (err, rows) {
												    			console.log('db callsetseq');
												    			if(err){
												    				fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
												    			 	logger.error("if_dma_00005_Db_Query_db callsetseq", err);
													    	    }else{
													    	    	logger.info("if_dma_00005_Db_Query_inserEstDtltQL", err);
																}
												    			if(checklev3item != lev3itempoint){
												    				checklev3item = lev3itempoint;
												    				connection.commit(function(err){
														    	        if(err){
														    	        	fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
														    	            connection.rollback(function(err){
														    	            	logger.error("if_dma_00005_Db_Query_db callsetseq_rollback", err);
														    	            });
														    	        } else {
														    	            console.log("Updated successfully!");
														    	            if(i == checkrow){
														    	            	var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.agentId ], function (err, rows) {
																    	    		if(err){
																    	    			fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
																		    	    	logger.error("if_dma_00005_Db_Query_callSQL", err);
																		    	    }else{
																		    	    	logger.info("if_dma_00005_Db_Query_callSQL", err);
																					}
																		    	    connection.commit(function(err){
																		    	        if(err){
																		    	        	fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
																		    	            connection.rollback(function(err){
																		    	            	logger.error("if_dma_00005_Db_Query_callSQL_rollback", err);
																		    	            });
																		    	        } else {
																		    	            console.log("Updated successfully!");
																		    	        }
																		    	    });
																		    	});
																    	    }
														    	        }
														    	    });
												    			}
													    	});
												    	}
													}).catch(function (err){
														logger.error("if_dma_00005_/voc/evaluation/_match", err);
												    });
												});
											});
										}else{
											logger.error("if_dma_00005_COUNSEL_TYPE_ID_null", err);
										}
										
									}else{
										logger.error("if_dma_00005_Db_Query_querystring2", err);
									}
								});
							}else{
								//bchm
								if(counsetltypeid != null || counsetltypeid != ""){
									connection.query(querystring3, [ data.result.data_list[i].startTime, data.result.data_list[i].ctiId ], function(err, rows, fields) {
										var content_text="";
										for(var i=0; i<rows.length;i++){
											content_text = content_text+rows[i].talk_content;
										}
										connection.query(querystring4, function(err, rows, fields) {
											for(var i=0; i<rows.length;i++){
												current_val = rows[i].current_val;
											}
											var updateCnt = parseInt(current_val)+1;
											connection.query(updateSequence, [ updateCnt ], function (err, rows) {
							    	    		if(err){
							    	    			logger.error("if_dma_00005_Db_Query_updateCurrent", err);
									    	    }else{
									    	    	logger.info("if_dma_00005_Db_Query_updateCurrent", err);
												}
									    	    connection.commit(function(err){
									    	        if(err){
									    	        	connection.rollback(function(err){
									    	            	logger.error("if_dma_00005_Db_Query_updateCurrent_rollback", err);
									    	            });
									    	        } else {
									    	            console.log("Updated successfully!");
									    	        }
									    	    });
									    	});

											var content_text = content_text.replace(/[0-9]/g, "");
											param = { "id" : counsetltypeid,
										    		  "text" : content_text.replace(/ /gi, "")
										    		};
													
											logger.debug("counsetltypeid : " +counsetltypeid);		
													
										    options1.body = JSON.stringify(param);
										    rp(options1).then(function ( data ){
										    	console.log('db rp(options1)');
										    	var callSQL = "call call_counsel_set(?, ?, ?, ?)";
										    	var inserEstDtlHisSQL = "  insert into nx_counsel_item_his (call_set_seq, start_time, extension, counsel_type_id, emp_id  "
														    		+", dept_id, lev3_counsel_item_id, lev4_counsel_item_id, lev3_item_point, lev4_item_point "
														    		+", item_count, item_type_cd, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) "
														    		+"select ?, ?, ?, ?, emp_id, dept_id, ?, ?, ?, ?, ?, ?, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate() from nx_emp where cti_id=? ";

										    	console.log('db data'+data);
										    	data = JSON.parse(data);
										    	console.log('db data.matches'+data.matches.length);
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
										    		var inserEstDtlquery = connection.query(inserEstDtlHisSQL, [ callsetseq, filedata.startTime, filedata.extension, data.id, counselitemid3, counselitemid4, lev3itempoint, lev4itempoint, data.matches[i].frequency, itemtypecd, filedata.agentId ], function (err, rows) {
										    			console.log('db callsetseq');
										    			if(err){
										    				fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
										    			 	logger.error("if_dma_00005_Db_Query_db callsetseq", err);
											    	    }else{
											    	    	logger.info("if_dma_00005_Db_Query_inserEstDtltQL", err);
														}
										    			if(checklev3item != lev3itempoint){
										    				checklev3item = lev3itempoint;
										    				connection.commit(function(err){
												    	        if(err){
												    	        	fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
												    	            connection.rollback(function(err){
												    	            	logger.error("if_dma_00005_Db_Query_db callsetseq_rollback", err);
												    	            });
												    	        } else {
												    	            console.log("Updated successfully!");
												    	            if(i == checkrow){
												    	            	var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.agentId ], function (err, rows) {
														    	    		if(err){
														    	    			fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
																    	    	logger.error("if_dma_00005_Db_Query_callSQL", err);
																    	    }else{
																    	    	logger.info("if_dma_00005_Db_Query_callSQL", err);
																			}
																    	    connection.commit(function(err){
																    	        if(err){
																    	        	fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
																    	            connection.rollback(function(err){
																    	            	logger.error("if_dma_00005_Db_Query_callSQL_rollback", err);
																    	            });
																    	        } else {
																    	            console.log("Updated successfully!");
																    	        }
																    	    });
																    	});
														    	    }
												    	        }
												    	    });
										    			}
											    	});
										    	}
											}).catch(function (err){
												logger.error("if_dma_00005_/voc/evaluation/_match", err);
										    });
										});
									});
								}else{
									logger.error("if_dma_00005_COUNSEL_TYPE_ID_null", err);
								}
							}
							
						}else{
							fs.rename(config.backup_path+file, config.backup_path_error+file, callback);
							logger.error("if_dma_00005_Db_Query_querystring", err);
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
		// 커넥션 반환.
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