const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
var client = require('./index');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
const winstonConfig = require(approot + '/lib/logger');
var productfile = "product.json";
/*******************************************************************************
 * 로그 설정.
 ******************************************************************************/
winston.loggers.add("migration", winstonConfig.createLoggerConfig("migration"));
var logger = winston.loggers.get("migration");

function getData(){
	logger.info("migration_start");
	
	!fs.existsSync(config.migration) && fs.mkdirSync(config.migration);
	fs.readdir(config.migration, function(err, filelist){
    	filelist.forEach(function(file) {
    		if(file.toString() != productfile){
    			fs.readFile(config.migration+file , 'utf-8' , function(err , filedata){
        			if(err) { return callerror(err); }
        			try{
        				filedata = JSON.parse(filedata);
        				console.log('bchm filedata = '+JSON.stringify(filedata)); 
        				
        				for(i in filedata){
        					pushData(filedata[i]);
            			}
        			}catch(e){
        				logger.error(e);
        			}
    			});
    		}
    	});
		
	});
	
	logger.info("migration_End");
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
	
    fs.readFile(config.migration+productfile , 'utf-8' , function(err , filedset){
		if(err) { return callerror(err); }
		try{
			
			filedset = JSON.parse(filedset);
			console.log('bchm filedset = '+JSON.stringify(filedset)); 
			
			for(i in filedset){
				if(filedata.productCode = filedset[i].productCode){
					filedata.productNm = filedset[i].productNm;
					filedata.Mcate = filedset[i].Mcate;
					filedata.McateNm = filedset[i].McateNm;
					filedata.company = filedset[i].company;
					filedata.companyNm = filedset[i].companyNm;
					filedata.mdId = filedset[i].mdId;
					filedata.mdNm = filedset[i].mdNm;
					filedata.PCate = filedset[i].PCate;
					filedata.PCateNm = filedset[i].PCateNm;
					break;
				}
			}
		}catch(e){
			logger.error(e);
		}
	});
    
	var document = {
		index : 'call_'+filedata.ifId.slice(0,6),
		type : "doc",
		id : filedata.ifId.replace('_','-'),
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
		console.log('update');
		logger.info("update success : " + document.id); 
	}, function(err){
			logger.error("update failed : " + document.id);
	});

}

getData();

module.exports = getData;