var express = require("express");
var router = express.Router();
var http = require('http');
var client = require('../index');
var common = require('./common');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("receive", winstonConfig.createLoggerConfig("receive"));
var logger = winston.loggers.get("receive");
var fs = require('fs');

router.post('/call', (req, res) => {
    logger.info("HTTP POST /receive/call");
	
	if( req.body.ifId !== undefined && req.body.vdn !== undefined && req.body.vdnGrp !== undefined && req.body.vdnGrpNm !== undefined ){

        var result = {
          ifId : req.body.ifId
        };
	  
	    var ntype = "1";
	    //new Module check
	    if(!common.getEmpty(req.body.recKey)) {	
			ntype = "1";		
		    var document = {
			  index : 'call_'+req.body.ifId.slice(0,6),
			//  index : "call_info_201911",
			  type : "doc",
			  id : req.body.ifId.replace('_','-'),
			  body : { 
			    doc : {
				  vdn : req.body.vdn,
				  vdnGrp : req.body.vdnGrp,
				  vdnNm : req.body.vdnNm,
				  vdnGrpNm : req.body.vdnGrpNm,
				  inCate : req.body.inCate,
				  inCateNm : req.body.inCateNm,
				  category1 : req.body.category1,
				  category1Nm : req.body.category1Nm,
				  category2 : req.body.category2,
				  category2Nm : req.body.category2Nm,
				  productCode : req.body.productCode,
				  productNm : req.body.productNm,
				  Mcate : req.body.Mcate,
				  McateNm : req.body.McateNm,
				  company : req.body.company,
				  companyNm : req.body.companyNm,
				  mdId : req.body.mdId,
				  mdNm : req.body.mdNm,
				  PCate : req.body.PCate,
				  PCateNm : req.body.PCateNm,
				  age : req.body.age,
				  gender : req.body.gender,
				  reasonCate1 : req.body.reasonCate1,
				  reasonCate1Nm : req.body.reasonCate1Nm,
				  reasonCate2 : req.body.reasonCate2,
				  reasonCate2Nm : req.body.reasonCate2Nm,
				  caseId : req.body.caseId,
				  caseNumber : req.body.caseNumber,
				  customerNumber : req.body.customerNumber,
				  status : req.body.status,
				  reasonDescription : req.body.reasonDescription 
				},
			  doc_as_upsert: true
			}
		  };
		  
		  client.update(document).then(function(resp) {
				var result = {
				  ifId : req.body.ifId,
				  code : "10",
				  message : "OK"
				}
				res.send(result);
			  }, function(err){
				var result = {
				  ifId : req.body.ifId,
				  code : "99",
				  message : "ERROR"
				}
				res.send(result);
			});
		  
		} else {
			var flag = true;
			ntype = "2";
			for(i in req.body.recKey){
				var document = {
				index : 'call_'+req.body.recKey[i].slice(0,6),
				//index : "call_info_201911",
				type : "doc",
				id : req.body.recKey[i].replace('_','-'),
				body : { 
				    doc : {
						vdn : req.body.vdn,
						vdnGrp : req.body.vdnGrp,
						vdnNm : req.body.vdnNm,
						vdnGrpNm : req.body.vdnGrpNm,
						inCate : req.body.inCate,
						inCateNm : req.body.inCateNm,
						category1 : req.body.category1,
						category1Nm : req.body.category1Nm,
						category2 : req.body.category2,
						category2Nm : req.body.category2Nm,
						productCode : req.body.productCode,
						productNm : req.body.productNm,
						Mcate : req.body.Mcate,
						McateNm : req.body.McateNm,
						company : req.body.company,
						companyNm : req.body.companyNm,
						mdId : req.body.mdId,
						mdNm : req.body.mdNm,
						PCate : req.body.PCate,
						PCateNm : req.body.PCateNm,
						age : req.body.age,
						gender : req.body.gender,
						reasonCate1 : req.body.reasonCate1,
						reasonCate1Nm : req.body.reasonCate1Nm,
						reasonCate2 : req.body.reasonCate2,
						reasonCate2Nm : req.body.reasonCate2Nm,
						caseId : req.body.caseId,
						caseNumber : req.body.caseNumber,
						customerNumber : req.body.customerNumber,
						status : req.body.status,
						reasonDescription : req.body.reasonDescription 
					    },
				        doc_as_upsert: true
				    }
			    };
			  
			    client.update(document).then(function(resp) {
				    if(flag) flag = true;
			    }, function(err){
					flag = false;	
				});
			}

			if(flag) {
				var result = {
					ifId : req.body.ifId,
					code : "10",
					message : "OK"
				}
				res.send(result);
			} else {
				var result = {
					ifId : req.body.ifId,
					code : "99",
					message : "ERROR"
				}
				res.send(result);
			}
		
		}
		
		!fs.existsSync(config.process_save_path) && fs.mkdirSync(config.process_save_path);
		var filename = config.process_save_path+req.body.ifId+".JSON";
		var filecontext = JSON.stringify(req.body);
		  
		logger.info("filename: " +  filename + " ntype:" + ntype);
		logger.info("filecontext: " +  filecontext);
		  
		fs.writeFile(filename, filecontext, "utf8", function(err) {
			if(err) {
				logger.error("File write error : ", err);
			}else{
				logger.info("File write : " + filename);
			}
		});
  
    } else {
	    logger.info("ifId, vdn, vdnGrp, vdnGrpNm  undefined ");
	    logger.info("ifId:" + req.body.ifId);
	    logger.info("vdn:" + req.body.vdn);
	    logger.info("vdnGrp:" + req.body.vdnGrp);
	    logger.info("vdnGrpNm:" + req.body.vdnGrpNm);
	    logger.info("caseId:" + req.body.caseId);
	    logger.info("caseNumber:" + req.body.caseNumber);
	    logger.info("inCateNm:" + req.body.inCateNm);	  
	    logger.info("message:" + req.body.message);	
      
	    result = common.getResult("40", "No ifId", "receive_call");
        res.send(result);
    }
  });

module.exports = router;