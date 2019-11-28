const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("if_uanalzyer", winstonConfig.createLoggerConfig("if_uanalzyer"));
var logger = winston.loggers.get("if_uanalzyer");
//var dbConn = require(approot + '/lib/MariaDBConn');
const mariadb = require('mysql');
const conn = {
    host : '10.253.42.184',
    user : 'ssgtv',
    password : 'ssgtv0930',
    database : 'ssgtv',
    connectionLimit : 5
};

var pool = mariadb.createPool(conn);

var options2 = {
    method: 'POST',
    uri: 'http://10.253.42.185:12800/voc/evaluation/_sync',
    headers: {
        Authorization : null,
        "content-type" : "application/json"
    },
    timeout: 10000,
    body : {
    	
    }
};

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


var iu = schedule.scheduleJob('30 30 * * * *', function(){
	var querystring = "SELECT A.* FROM "
					+" (SELECT NCT.COUNSEL_TYPE_ID "
					+" 	   , NCT.TITLE	 "
					+" 	   , NCI.LEV3_COUNSEL_ITEM_ID	 "
					+" 	   , NCI.LEV4_COUNSEL_ITEM_ID	 "
					+" 	   , NCI.ITEM_TYPE_CD "
					+" 	   , NCI.LEV4 "
					+" 	   , NCI.LEVEL "
					+" 	   , NCI.LEV3_ITEM_POINT "
					+"       , NCI.LEV4_ITEM_POINT "
					+"       , NCS.SENTENCE "
					+" 	   , NCI.SORT_ORDER "
					+" 	   , NCT.DEPT_ID "
					+" 	   , NCS.COUNSEL_SENTENCE_ID "
					+"   FROM (SELECT NCI4.TITLE AS LEV4 "
					+" 	   , NCI3.COUNSEL_ITEM_ID AS LEV3_COUNSEL_ITEM_ID "
					+" 	   , NCI4.COUNSEL_ITEM_ID AS LEV4_COUNSEL_ITEM_ID "
					+" 	   , NCI3.ITEM_TYPE_CD "
					+" 	   , NCI1.COUNSEL_TYPE_ID "
					+" 	   , NCI3.ITEM_POINT AS LEV3_ITEM_POINT "
					+"   	   , NCI4.ITEM_POINT AS LEV4_ITEM_POINT "
					+"   	   , NCI4.LEVEL "
					+"   	   , NCI4.SORT_ORDER "
					+"   	   , NCI4.MATCH_EST_YN "
					+"   FROM NX_COUNSEL_ITEM AS NCI1 "
					+"   LEFT JOIN NX_COUNSEL_ITEM AS NCI3 ON NCI3.PRE_COUNSEL_ITEM_ID = NCI1.COUNSEL_ITEM_ID "
					+"   LEFT JOIN NX_COUNSEL_ITEM AS NCI4 ON NCI4.PRE_COUNSEL_ITEM_ID = NCI3.COUNSEL_ITEM_ID "
					+"  WHERE NCI4.LEVEL = 3 "
					+" ) NCI LEFT JOIN NX_COUNSEL_TYPE NCT "
					+"   	   ON (NCI.COUNSEL_TYPE_ID = NCT.COUNSEL_TYPE_ID AND NCT.USE_YN = 'Y') "
					+"   	  LEFT JOIN NX_COUNSEL_SENTENCE NCS "
					+"   	   ON (NCI.COUNSEL_TYPE_ID = NCS.COUNSEL_TYPE_ID AND NCI.LEV4_COUNSEL_ITEM_ID = NCS.COUNSEL_ITEM_ID AND NCS.USE_YN = 'Y') "
					+" UNION ALL "
					+" SELECT NCT.COUNSEL_TYPE_ID "
					+" 	   , NCT.TITLE	 "
					+" 	   , NCI.LEV3_COUNSEL_ITEM_ID	 "
					+" 	   , NCI.LEV4_COUNSEL_ITEM_ID	 "
					+" 	   , NCI.ITEM_TYPE_CD "
					+" 	   , NCI.LEV4 "
					+" 	   , NCI.LEVEL "
					+" 	   , NCI.LEV3_ITEM_POINT "
					+"       , NCI.LEV4_ITEM_POINT "
					+"       , NCK.KEYWORD "
					+" 	   , NCI.SORT_ORDER "
					+" 	   , NCT.DEPT_ID "
					+" 	   , NCK.COUNSEL_KEYWORD_ID "
					+"   FROM (SELECT NCI4.TITLE AS LEV4 "
					+" 	   , NCI3.COUNSEL_ITEM_ID AS LEV3_COUNSEL_ITEM_ID "
					+" 	   , NCI4.COUNSEL_ITEM_ID AS LEV4_COUNSEL_ITEM_ID "
					+" 	   , NCI3.ITEM_TYPE_CD "
					+" 	   , NCI1.COUNSEL_TYPE_ID "
					+" 	   , NCI3.ITEM_POINT AS LEV3_ITEM_POINT "
					+"   	   , NCI4.ITEM_POINT AS LEV4_ITEM_POINT "
					+"   	   , NCI4.LEVEL "
					+"   	   , NCI4.SORT_ORDER "
					+"   	   , NCI4.MATCH_EST_YN "
					+"   FROM NX_COUNSEL_ITEM AS NCI1 "
					+"   LEFT JOIN NX_COUNSEL_ITEM AS NCI3 ON NCI3.PRE_COUNSEL_ITEM_ID = NCI1.COUNSEL_ITEM_ID "
					+"   LEFT JOIN NX_COUNSEL_ITEM AS NCI4 ON NCI4.PRE_COUNSEL_ITEM_ID = NCI3.COUNSEL_ITEM_ID "
					+"  WHERE NCI4.LEVEL = 3 "
					+" ) NCI LEFT JOIN NX_COUNSEL_KEYWORD NCK "
					+"   	   ON (NCI.COUNSEL_TYPE_ID = NCK.COUNSEL_TYPE_ID AND NCI.LEV4_COUNSEL_ITEM_ID = NCK.COUNSEL_ITEM_ID AND NCK.USE_YN = 'Y')	 "
					+"   	  LEFT JOIN NX_COUNSEL_TYPE NCT "
					+"   	   ON (NCI.COUNSEL_TYPE_ID = NCT.COUNSEL_TYPE_ID AND NCT.USE_YN = 'Y') "
					+"  ) A "
					+"  WHERE A.SENTENCE IS NOT NULL	 "
					+" ORDER BY LEV3_COUNSEL_ITEM_ID, LEV4_COUNSEL_ITEM_ID, LEVEL, SORT_ORDER ";
	param1 = {
			  "id": "",
			  "extradata": "",
			  "use": true,
			  "expressions": []
			};
	pool.getConnection(function(err, connection){
		connection.query(querystring, function(err, rows, fields) {
			if (!err){
				for(var i=0; i<rows.length;i++){
			    	if(i == 0){
			    		param1.id = rows[i].COUNSEL_TYPE_ID;
			    		param1.extradata = "name="+rows[i].TITLE+",counselitemid="+rows[i].LEV1_COUNSEL_ITEM_ID;
			    		param2 = {
			    			      "id": "",
			    			      "extradata": "",
			    			      "use": true,
			    			      "expression": "",
			    			      "synonyms": []
			    			    }
			    		param2.id = rows[i].LEV4_COUNSEL_ITEM_ID;
			    		param2.extradata = "LEVEL4="+rows[i].LEV4_ITEM_POINT+",counselitemid3="+rows[i].LEV3_COUNSEL_ITEM_ID+",counselitemid4="+rows[i].LEV4_COUNSEL_ITEM_ID+",LEVEL4="+rows[i].LEV4_ITEM_POINT+",ITEM_TYPE_CD="+rows[i].ITEM_TYPE_CD;
			    		param2.expression = rows[i].SENTENCE.replace(/OOO/gi, "${NAME}");
			    	}else{
			    		var j = i-1;
			    		if(rows[j].LEV4_COUNSEL_ITEM_ID == rows[i].LEV4_COUNSEL_ITEM_ID){
			    			param3 = {
			    					"expression": rows[i].SENTENCE.replace(/OOO/gi, "${NAME}"),
			    					"use": true
			    		         };
			    			param2.synonyms.push(param3);
			    		}else{
			    			param1.expressions.push(param2);
			    			param2 = {
			    				      "id": "",
			    				      "extradata": "",
			    				      "use": true,
			    				      "expression": "",
			    				      "synonyms": []
			    				    }
			    			param2.id = rows[i].LEV4_COUNSEL_ITEM_ID;
			    			param2.extradata = "LEVEL4="+rows[i].LEV4_ITEM_POINT+",counselitemid3="+rows[i].LEV3_COUNSEL_ITEM_ID+",counselitemid4="+rows[i].LEV4_COUNSEL_ITEM_ID+",LEVEL4="+rows[i].LEV4_ITEM_POINT+",ITEM_TYPE_CD="+rows[i].ITEM_TYPE_CD;
				    		param2.expression = rows[i].SENTENCE.replace(/OOO/gi, "${NAME}");
			    		}
			    	}
			    	
			    }
				options2.body = JSON.stringify(param1);
			    rp(options2).then(function ( data ){
			    	data = JSON.parse(data);
			    }).catch(function (err){
			    	logger.error("if_uanalzyer_/voc/evaluation/_sync", err);
			    });
			}
			else
				logger.error("if_uanalzyer_Db_Query", err);
		});
	});
}); 

var io = schedule.scheduleJob('30 30 * * * *', function(){
	fs.readdir(config.backup_path, function(err, filelist){
		console.log('file readdir');
		if(err) { return callerror(err); }
		filelist.forEach(function(file) {
			console.log('file forEach');
			if(file.substring(file.lastIndexOf("-"),file.lenght) == '-T'){
				fs.readFile(config.backup_path+file , 'utf-8' , function(err , filedata){
					if(err) { return callerror(err); }
					filedata = JSON.parse(filedata);
					var counsetltypeid = "";
					var callsetseq = "";
					pool.getConnection(function(err, connection){
						console.log('file pool.getConnection');
						var querystring  = "SELECT NCT.COUNSEL_TYPE_ID, (SELECT CURRENT_VAL FROM NX_SEQUENCE WHERE SEQUENCE_ID = 'CALL_SET_SEQ'  LIMIT 1) AS SEQ FROM NX_COUNSEL_TYPE NCT, NX_EMP NE WHERE NCT.DEPT_ID = NE.DEPT_ID AND NE.CTI_ID = ? LIMIT 1";
						connection.query(querystring, [ filedata.agentId ], function(err, rows, fields) {
							console.log('db querystring');
							if (!err){
								for(var i=0; i<rows.length;i++){
							    	counsetltypeid = rows[i].COUNSEL_TYPE_ID; //resultId에 해당하는 부분만 가져옴
							    	callsetseq = rows[i].SEQ; //resultId에 해당하는 부분만 가져옴
							    }
								if(counsetltypeid != null || counsetltypeid != ""){
									param = { "id" : counsetltypeid,
								    		  "text" : filedata.timeNtalk.replace(/[0-9]/g, "")
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
									    	    	console.log("bchm err = "+err);
									    	    	connection.release();
									    	        throw err;
									    	    }else{
									    	    	logger.info("if_uanalzyer_Db_Query_callSQL", err);
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
									    	    fs.unlink(config.backup_path+file, function(err){
									    	        if( err ) throw err;
									    	        console.log('file deleted');
									    	    });
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
									    	        connection.release();
									    	        throw err;
									    	    }else{
									    	    	logger.info("if_uanalzyer_Db_Query_inserEstDtltQL", err);
												}
									    	    connection.commit(function(err){
									    	        if(err){
									    	            connection.rollback(function(err){
									    	                throw err;
									    	            });
									    	        } else {
									    	            console.log("Updated successfully!");
									    	            if(i == checkrow){
									    	            	var callSQLquery = connection.query(callSQL, [ callsetseq, filedata.startTime, filedata.extension, filedata.agentId ], function (err, rows) {
											    	    		if(err){
													    	    	console.log("bchm err = "+err);
													    	    	connection.release();
													    	        throw err;
													    	    }else{
													    	    	logger.info("if_uanalzyer_Db_Query_callSQL", err);
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
													    	    fs.unlink(config.backup_path+file, function(err){
													    	        if( err ) throw err;
													    	        console.log('file deleted');
													    	    });
													    	});
											    	    }
									    	        }
									    	    });
									    	    
									    	    connection.release();
									    	});
								    	}
									}).catch(function (err){
										logger.error("if_uanalzyer_/voc/evaluation/_match", err);
								    });
								}else{
									logger.error("if_uanalzyer_COUNSEL_TYPE_ID_null", err);
								}
							}
							else
								logger.error("if_uanalzyer_Db_Query_2", err);
						});
					});
				});
			}else{
				if(file.substring(file.lastIndexOf("-"),file.lenght) == '-R'){
					fs.unlink(config.backup_path+file, function(err){
		    	        if( err ){
		    	        	throw err;
		    	        }
		    	        console.log('file deleted');
		    	    });
				}
			}
	    });
	})
}); 

function callerror(err){
	logger.error("if_uanalzyer_file_error", err);
}

function getData(){
	
	//iu.invoke();
	io.invoke();
}

getData();

module.exports = getData;