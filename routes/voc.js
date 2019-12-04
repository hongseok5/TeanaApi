var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("voc", winstonConfig.createLoggerConfig("voc"));
var logger = winston.loggers.get("voc");

router.post("/search", function(req, res){
    logger.info("Router for IF_DMA_00701");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    var source = ["extension","casenumber","endTime","duration","company","companyNm","productCode","productNm","Mcate","McateNm","mdId","mdNm","startTime","extension","ifId", "content", "reContent"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, source);
    var index = common.getIndex(req.body.channel);
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : common.convertCategory(req.body.category) }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.productCode))
        body.query.bool.filter.push({ term : { product : req.body.productCode }});
    if(common.getEmpty(req.body.Mcate) && req.body.Mcate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.keyword))
        body.query.bool.filter.push({ term : { keyword : req.body.keyword }});
	if(common.getEmpty(req.body.skeyword)) {
		body.query.bool.filter.simple_query_string = {
			query: req.body.skeyword,   // 검색어
            fields: ["timeNtalk", "content", "reContent"]  // 검색어가 있는지 확인하는 복수개의 필드
        };
	}
        
    client.search({
        index ,
        body 
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "channel_statistics");
    	result.data.count = resp.hits.total;
        result.data.result = [];
        test = Object.entries(resp.hits.hits);
        for(i in test){
        	var obj = {
        		extension : test[i][1]._source.extension,
        		casenumber : common.convertEmpty(test[i][1]._source.casenumber),
        		callDt : test[i][1]._source.startTime.slice(0,8),
        		startDtm : common.convertDtm(test[i][1]._source.startTime),
        		endDtm : common.convertDtm(test[i][1]._source.endTime),
        		duration : common.convertDuration(test[i][1]._source.duration),
        		company : test[i][1]._source.company,
        		companyNm : test[i][1]._source.companyNm,
        		productCode : test[i][1]._source.productCode,
        		productNm : test[i][1]._source.productNm,
        		Mcate : test[i][1]._source.Mcate,
        		McateNm : test[i][1]._source.McateNm,
        		mdId : test[i][1]._source.mdId,
        		mdNm : test[i][1]._source.mdNm,
        		startTime : test[i][1]._source.startTime,
				extension : test[i][1]._source.extension,
        		channel : test[i][1]._index,
        		ifId : test[i][1]._source.ifId,
				content : test[i][1]._source.content,
				reContent : test[i][1]._source.reContent
            }
        	result.data.result.push(obj);
        }
        res.send(result);
    }, function(err){
		logger.error("channel_statistics ", err);
        var result = common.getResult( "99", "ERROR", "channel_statistics");
        res.send(result);
    });
});

module.exports = router;