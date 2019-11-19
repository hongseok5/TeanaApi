var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');
var config = require('../config/config');
var fs = require('fs');
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'receive' },
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: './logs/receive.log' })
    ]
  });
router.post('/call', (req, res) => {
    //logger.info("HTTP POST /receive/call" + req.ip + Date());
	if( req.body.ifId !== undefined && req.body.vdn !== undefined && req.body.vdnGrp !== undefined && req.body.vdnGrpNm !== undefined ){

      var result = {
        ifId : req.body.ifId
      };
      var document = {
        index : "call_info_201911",
        type : "doc",
        id : req.body.ifId,
        body : { 
          vdn : req.body.vdn,
          vdnGrp : req.body.vdnGrp,
          vdnNm : req.body.vdnNm,
          vdnGrpNm : req.body.GrpNm,
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
          caseId : req.body.caseId
        }
      };
      
      !fs.existsSync(config.process_save_path) && fs.mkdirSync(config.process_save_path);
  	  var filename = config.process_save_path+req.body.ifId+".JSON";
  	  var filecontext = JSON.stringify(req.body);
  	  fs.writeFile(filename, filecontext, "utf8", function(err) {
      	logger.info("error file : " + err);
      });
      client.index(document).then(function(resp) {
        var result = {
          ifId : req.ifId,
          code : "10",
          message : "OK"
        }
        res.send(result);
      }, function(err){
        var result = {
          ifId : req.ifId,
          code : "99",
          message : "ERROR"
        }
        res.send(result);
      });
      
    } else {
      result = common.getResult("40", "No ifId", "receive_call");
      res.send(result);
    }
  
    /*
    if (result.ifId === undefined){
     result.code = "99";
     result.message = "필수값 누락";
     res.send(JSON.stringify(result));
    } else {
      **  파일쓰기 코드, 파일에 쓰지 않고 ES에 바로 저장하기 **
     fs.writeFile(config.write_path + result.ifId + ".JSON",  'utf-8', function(err) {
       if(err) {

         result.code = "99";
         result.message = "파일 수신 실패";
         res.send(JSON.stringify(result));
         console.log('파일 쓰기 실패');

       } else {
         result.code = "10";
         result.message = "파일 정상 수신";
         res.send(JSON.stringify(result));
         console.log('파일 쓰기 완료');
       }
     });
    }
    */
  });


module.exports = router;