const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
var client = require('./index');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
function sleep(ms){
	  return new Promise( resolve => {
	    setTimeout(resolve, ms);
	  })
	}
var ms = 1000;
/*******************************************************************************
 * 로그 설정.
 ******************************************************************************/
winston.loggers.add("mygration", winstonConfig.createLoggerConfig("mygration"));
var logger = winston.loggers.get("mygration");

var options2 = {
    method: 'POST',
    uri: 'http://10.253.42.185:3001/receive/call',
    headers: {
        "Authorization" : null,
        "Content-Type" : "application/json",
    },
    timeout: 10000,
    body : ""
};


var io = schedule.scheduleJob('0 30 3 * * *', function(){
	logger.info("mygration_start");
	
	!fs.existsSync(config.mygration) && fs.mkdirSync(config.mygration);
	fs.readdir(config.mygration, function(err, filelist){
    	filelist.forEach(function(file) {
    		fs.readFile(config.mygration+file , 'utf-8' , function(err , filedata){
    			if(err) { return callerror(err); }
    			try{
    				
    				
    				filedata = JSON.parse(filedata);
    				console.log('bchm filedata = '+JSON.stringify(filedata)); 
    				
    				for(i in filedata){
    					var document = {
    	    				    index : 'call_'+filedata[i].ifId.slice(0,6),
    	    				    type : "doc",
    	    				    id : filedata[i].ifId.replace('_','-'),
    	    				    body : { 
    	    				    	doc : {
    	    				    		  vdn : filedata[i].vdn,
    	    							  vdnGrp : filedata[i].vdnGrp,
    	    							  vdnNm : filedata[i].vdnNm,
    	    							  vdnGrpNm : filedata[i].vdnGrpNm,
    	    							  inCate : filedata[i].inCate,
    	    							  inCateNm : filedata[i].inCateNm,
    	    							  category1 : filedata[i].category1,
    	    							  category1Nm : filedata[i].category1Nm,
    	    							  category2 : filedata[i].category2,
    	    							  category2Nm : filedata[i].category2Nm,
    	    							  productCode : filedata[i].productCode,
    	    							  productNm : filedata[i].productNm,
    	    							  Mcate : filedata[i].Mcate,
    	    							  McateNm : filedata[i].McateNm,
    	    							  company : filedata[i].company,
    	    							  companyNm : filedata[i].companyNm,
    	    							  mdId : filedata[i].mdId,
    	    							  mdNm : filedata[i].mdNm,
    	    							  PCate : filedata[i].PCate,
    	    							  PCateNm : filedata[i].PCateNm,
    	    							  age : filedata[i].age,
    	    							  gender : filedata[i].gender,
    	    							  reasonCate1 : filedata[i].reasonCate1,
    	    							  reasonCate1Nm : filedata[i].reasonCate1Nm,
    	    							  reasonCate2 : filedata[i].reasonCate2,
    	    							  reasonCate2Nm : filedata[i].reasonCate2Nm,
    	    							  caseId : filedata[i].caseId,
    	    							  caseNumber : filedata[i].caseNumber,
    	    							  customerNumber : filedata[i].customerNumber,
    	    							  status : filedata[i].status,
    	    							  reasonDescription : filedata[i].reasonDescription 
    	    				    	},
    	    					doc_as_upsert: true
    	    				    }
    	    				};
    					
    					client.update(document).then(function(resp) {
    						console.log('update'); 
    				     });
    					sleep(ms);
        			}
    			}catch(e){
    				logger.error(e);
    			}
			});
		});
		
	});
	
	logger.info("mygration_End");
}); 

function getData(){
	io.invoke();
}
getData();

module.exports = getData;