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
    host : '10.253.42.121',
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

var iu = schedule.scheduleJob('0 20 9 * * *', function(){
	//console.log('bchm'); 
	var typequerystring = " select counsel_type_id, counsel_item_id, title from nx_counsel_item where pre_counsel_item_id='top' ";
	var querystring = "select a.* from "
					+" (select nct.counsel_type_id "
					+" 	   , nct.title	 "
					+" 	   , nci.lev3_counsel_item_id	 "
					+" 	   , nci.lev4_counsel_item_id	 "
					+" 	   , nci.item_type_cd "
					+" 	   , nci.lev4 "
					+" 	   , nci.level "
					+" 	   , nci.lev3_item_point "
					+"       , nci.lev4_item_point "
					+"       , ncs.sentence "
					+" 	   , nci.sort_order "
					+" 	   , nct.dept_id "
					+" 	   , ncs.counsel_sentence_id "
					+"   from (select nci4.title as lev4 "
					+" 	   , nci3.counsel_item_id as lev3_counsel_item_id "
					+" 	   , nci4.counsel_item_id as lev4_counsel_item_id "
					+" 	   , nci3.item_type_cd "
					+" 	   , nci1.counsel_type_id "
					+" 	   , nci3.item_point as lev3_item_point "
					+"   	   , nci4.item_point as lev4_item_point "
					+"   	   , nci4.level "
					+"   	   , nci4.sort_order "
					+"   	   , nci4.match_est_yn "
					+"   from nx_counsel_item as nci1 "
					+"   left join nx_counsel_item as nci3 on nci3.pre_counsel_item_id = nci1.counsel_item_id "
					+"   left join nx_counsel_item as nci4 on nci4.pre_counsel_item_id = nci3.counsel_item_id "
					+"  where nci4.level = 3 "
					+" ) nci left join nx_counsel_type nct "
					+"   	   on (nci.counsel_type_id = nct.counsel_type_id and nct.use_yn = 'Y') "
					+"   	  left join nx_counsel_sentence ncs "
					+"   	   on (nci.counsel_type_id = ncs.counsel_type_id and nci.lev4_counsel_item_id = ncs.counsel_item_id and ncs.use_yn = 'Y') "
					+" union all "
					+" select nct.counsel_type_id "
					+" 	   , nct.title	 "
					+" 	   , nci.lev3_counsel_item_id	 "
					+" 	   , nci.lev4_counsel_item_id	 "
					+" 	   , nci.item_type_cd "
					+" 	   , nci.lev4 "
					+" 	   , nci.level "
					+" 	   , nci.lev3_item_point "
					+"       , nci.lev4_item_point "
					+"       , nck.keyword "
					+" 	   , nci.sort_order "
					+" 	   , nct.dept_id "
					+" 	   , nck.counsel_keyword_id "
					+"   from (select nci4.title as lev4 "
					+" 	   , nci3.counsel_item_id as lev3_counsel_item_id "
					+" 	   , nci4.counsel_item_id as lev4_counsel_item_id "
					+" 	   , nci3.item_type_cd "
					+" 	   , nci1.counsel_type_id "
					+" 	   , nci3.item_point as lev3_item_point "
					+"   	   , nci4.item_point as lev4_item_point "
					+"   	   , nci4.level "
					+"   	   , nci4.sort_order "
					+"   	   , nci4.match_est_yn "
					+"   from nx_counsel_item as nci1 "
					+"   left join nx_counsel_item as nci3 on nci3.pre_counsel_item_id = nci1.counsel_item_id "
					+"   left join nx_counsel_item as nci4 on nci4.pre_counsel_item_id = nci3.counsel_item_id "
					+"  where nci4.level = 3 "
					+" ) nci left join nx_counsel_keyword nck "
					+"   	   on (nci.counsel_type_id = nck.counsel_type_id and nci.lev4_counsel_item_id = nck.counsel_item_id and nck.use_yn = 'Y')	 "
					+"   	  left join nx_counsel_type nct "
					+"   	   on (nci.counsel_type_id = nct.counsel_type_id and nct.use_yn = 'Y') "
					+"  ) a "
					+"  where a.sentence is not null and counsel_type_id = ?	 "
					+" order by lev3_counsel_item_id, lev4_counsel_item_id, level, sort_order ";
	  
	pool.getConnection(function(err, connection){
		connection.query(typequerystring, function(typeerr, typerows, typefields) {
			
			//console.log('bchm 2');
			for(var k=0;  k<typerows.length; k++){
				if (!typeerr){
					connection.query(querystring, [typerows[k].counsel_type_id], function(err, rows, fields) {
						if (!err){
							param1 = {
									  "id": "",
									  "extradata": "",
									  "use": true,
									  "expressions": []
									};
							for(var i=0; i<rows.length; i++){
						    	if(i == 0){
						    		param1.id = rows[i].counsel_type_id;
						    		param1.extradata = "name="+rows[i].title+",counselitemid="+rows[i].lev1_counsel_item_id;
						    		param2 = {
						    			      "id": "",
						    			      "extradata": "",
						    			      "use": true,
						    			      "expression": "",
						    			      "synonyms": []
						    			    }
						    		param2.id = rows[i].lev4_counsel_item_id;
						    		param2.extradata = "level4="+rows[i].lev4_item_point+",counselitemid3="+rows[i].lev3_counsel_item_id+",counselitemid4="+rows[i].lev4_counsel_item_id+",level3="+rows[i].lev3_item_point+",item_type_cd="+rows[i].item_type_cd;
						    		var senteval = rows[i].sentence.replace(/OOO/gi, "${NAME}");
						    		param2.expression = senteval.replace(/ /gi, "");
						    	}else{
						    		var j = i-1;
						    		if(rows[j].lev4_counsel_item_id == rows[i].lev4_counsel_item_id){
						    			var senteval = rows[i].sentence.replace(/OOO/gi, "${NAME}");
							    		param3 = {
						    					"expression": senteval.replace(/ /gi, ""),
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
						    			param2.id = rows[i].lev4_counsel_item_id;
						    			param2.extradata = "level4="+rows[i].lev4_item_point+",counselitemid3="+rows[i].lev3_counsel_item_id+",counselitemid4="+rows[i].lev4_counsel_item_id+",level3="+rows[i].lev3_item_point+",item_type_cd="+rows[i].item_type_cd;
							    		var senteval = rows[i].sentence.replace(/OOO/gi, "${NAME}");
							    		param2.expression = senteval.replace(/ /gi, "");
							    		
						    		}
						    	}
						    	
						    }
							
							options.body = JSON.stringify(param1);
						    rp(options).then(function ( data ){
						    	data = JSON.parse(data);
								if(data.error) {
									logger.error("if_evaluation_/voc/evaluation/_sync [" + data.id + "] [" + data.message + "] Error" );
								}else{
									logger.info("if_evaluation_/voc/evaluation/_sync [" + data.id + "] Completed" );
								}
						    }).catch(function (err){
						    	logger.error("if_evaluation_/voc/evaluation/_sync", err);
						    });
							
						}
						else
							logger.error("if_evaluation_Db_Query", err);
					});
				}
				else
					logger.error("if_evaluation_Db_Query", err);
			}
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