const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const dateFormat = require('dateformat');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
/*******************************************************************************
 * 로그 설정.
 ******************************************************************************/
winston.loggers.add("if_migration", winstonConfig.createLoggerConfig("if_migration"));
var logger = winston.loggers.get("if_migration");

const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ 
  host : '10.253.42.185:9200',
  log: 'trace',
  apiVersion: '6.8' // insert 수행시 필요한 설정
});

//개발
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
    uri: 'https://ssgtv--partsb.my.salesforce.com/services/apexrest/IF_STCS_DMA_00002',
    headers: {
        Authorization : null
    },
    timeout: 10000,
    body : ""
};

//운영
/**
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
    uri: 'https://ssgtv.my.salesforce.com/services/apexrest/IF_STCS_DMA_00002',
    headers: {
        Authorization : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};
*/

function getData(){
	logger.info("if migration start");
	
	rp(options1).then( function(body) {
    	var token = JSON.parse(body);
        options2.headers.Authorization = "OAuth " + token.access_token;
 
//		console.log("token:" + token.access_token);
		
		//요청시간 (실행 파라메터로 받음. node if_migration.js 시작시간 종료시간)
		var argvParam = process.argv.slice(2);
		if(!getEmpty(argvParam[0])) {
			console.log("There is no required searchFromDate = yyyyMMddhhmmss");
			return;
		}
		if(!getEmpty(argvParam[1])) {
			console.log("There is no required searchToDate = yyyyMMddhhmmss");
			return;
		}
		
		var fromDate = argvParam[0];
		var toDate   = argvParam[1];
		
		console.log("시작시간:" + argvParam[0]);
		console.log("종료시간:" + argvParam[1]);
		
//		var fromDate = "20200201000000";
//		var toDate   = "20200205235959";
 
		param = {"searchFromDate": fromDate, "searchToDate": toDate, clientId : "daeunextier", clientPw : "3B604775904A5C7535E2670F28"};
        options2.body = JSON.stringify(param);
        
		rp(options2).then(function ( data ){
        	data = JSON.parse(data);
        	console.log("result Data count = "+ data.result.count);
        	if(data.status.code == "00" || data.status.code == "10"){
        		for(i in data.result.data_list){
        			pushData(data.result.data_list[i]);
        		}
            }else{
            	logger.info(data);
            }
        }).catch(function (err){
        	logger.info("error Salesforce Interface : " + err);
        });
    }).catch(function (err) {
        console.error("error Salesforce connection : " + err);
    });
	
	logger.info("if migration end");
}

function getEmpty(value) {
	var rtn = false;
	if (typeof value != 'undefined' && value) {
		rtn = true;
	}
	return rtn;
}

function sleep(ms){
  return new Promise( resolve => {
    setTimeout(resolve, ms);
  })
}
var ms = 0;
async function pushData( filedata ){
    ms += 200;
    await sleep(ms);
    
	for(i in filedata.recKey){
		var document = {
			index : 'call_'+filedata.recKey[i].slice(0,6),
			type : "doc",
			id : filedata.recKey[i].replace('_','-'),
			body : { 
				doc : {
					  vdn : filedata.vdn,
					  vdnGrp : filedata.vdnGrp,
					  vdnNm : filedata.vdnNm,
					  vdnGrpNm : filedata.vdnGrpNm,
					  inCate : filedata.inCate,
					  inCateNm : filedata.inCateNm,
					  category1 : filedata.category1,
					  category1Nm : filedata.category1Nm,
					  category2 : filedata.category2,
					  category2Nm : filedata.category2Nm,
					  productCode : filedata.productCode,
					  productNm : filedata.productNm,
					  Mcate : filedata.Mcate,
					  McateNm : filedata.McateNm,
					  company : filedata.company,
					  companyNm : filedata.companyNm,
					  mdId : filedata.mdId,
					  mdNm : filedata.mdNm,
					  PCate : filedata.PCate,
					  PCateNm : filedata.PCateNm,
					  age : filedata.age,
					  gender : filedata.gender,
					  reasonCate1 : filedata.reasonCate1,
					  reasonCate1Nm : filedata.reasonCate1Nm,
					  reasonCate2 : filedata.reasonCate2,
					  reasonCate2Nm : filedata.reasonCate2Nm,
					  caseId : filedata.caseId,
					  caseNumber : filedata.caseNumber,
					  customerNumber : filedata.customerNumber,
					  status : filedata.status,
					  reasonDescription : filedata.reasonDescription 
				},
				doc_as_upsert: true
			}
		};

		client.update(document).then(function(resp) {
			logger.info("update success : " + document.id); 
		}, function(err){
			logger.error("update failed : " + document.id);
		});
	}

}

getData();

module.exports = getData;