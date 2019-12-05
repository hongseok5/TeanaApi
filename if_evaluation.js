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

var iu = schedule.scheduleJob('30 30 * * * *', function(){
	console.log('bchm'); 
	var typequerystring = " SELECT COUNSEL_TYPE_ID, COUNSEL_ITEM_ID, TITLE FROM NX_COUNSEL_ITEM WHERE PRE_COUNSEL_ITEM_ID='top' ";
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
					+"  WHERE A.SENTENCE IS NOT NULL AND COUNSEL_TYPE_ID = ?	 "
					+" ORDER BY LEV3_COUNSEL_ITEM_ID, LEV4_COUNSEL_ITEM_ID, LEVEL, SORT_ORDER ";
	
	pool.getConnection(function(err, connection){
		connection.query(typequerystring, function(typeerr, typerows, typefields) {
			console.log('bchm 2');
			for(var k=0;  k<typerows.length; k++){
				console.log('bchm row = '+typerows.length);
				if (!typeerr){
					param1 = {
							  "id": typerows[k].COUNSEL_TYPE_ID,
							  "extradata": "name="+typerows[k].TITLE+",counselitemid="+typerows[k].COUNSEL_ITEM_ID,
							  "use": true,
							  "expressions": []
							};
					console.log('bchm typerows[k].COUNSEL_TYPE_ID = '+typerows[k].COUNSEL_TYPE_ID);
					connection.query(querystring, [typerows[k].COUNSEL_TYPE_ID], function(err, rows, fields) {
						if (!err){
							for(var i=0; i<rows.length; i++){
						    	if(i == 0){
						    		param2 = {
						    			      "id": "",
						    			      "extradata": "",
						    			      "use": true,
						    			      "expression": "",
						    			      "synonyms": []
						    			    }
						    		param2.id = rows[i].LEV4_COUNSEL_ITEM_ID;
						    		param2.extradata = "LEVEL4="+rows[i].LEV4_ITEM_POINT+",counselitemid3="+rows[i].LEV3_COUNSEL_ITEM_ID+",counselitemid4="+rows[i].LEV4_COUNSEL_ITEM_ID+",LEVEL3="+rows[i].LEV3_ITEM_POINT+",ITEM_TYPE_CD="+rows[i].ITEM_TYPE_CD;
						    		var senteval = rows[i].SENTENCE.replace(/OOO/gi, "${NAME}");
						    		param2.expression = senteval.replace(/ /gi, "");
						    	}else{
						    		var j = i-1;
						    		if(rows[j].LEV4_COUNSEL_ITEM_ID == rows[i].LEV4_COUNSEL_ITEM_ID){
						    			var senteval = rows[i].SENTENCE.replace(/OOO/gi, "${NAME}");
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
						    			param2.id = rows[i].LEV4_COUNSEL_ITEM_ID;
						    			param2.extradata = "LEVEL4="+rows[i].LEV4_ITEM_POINT+",counselitemid3="+rows[i].LEV3_COUNSEL_ITEM_ID+",counselitemid4="+rows[i].LEV4_COUNSEL_ITEM_ID+",LEVEL3="+rows[i].LEV3_ITEM_POINT+",ITEM_TYPE_CD="+rows[i].ITEM_TYPE_CD;
							    		var senteval = rows[i].SENTENCE.replace(/OOO/gi, "${NAME}");
							    		param2.expression = senteval.replace(/ /gi, "");
							    		
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
				}
				else
					logger.error("if_uanalzyer_Db_Query", err);
			}
		});
	});
}); 

function getData(){
	
	iu.invoke();
	
}

getData();

module.exports = getData;