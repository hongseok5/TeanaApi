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

    let size = req.body.size || 10;
    let from = req.body.from || 1;
    var source = ["company","companyNm","productCode","productNm","Mcate","McateNm","mdId","mdNm","startTime","extension","ifId"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, source);
    var index = common.getIndex(req.body.channel);
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.productCode))
        body.query.bool.filter.push({ term : { product : req.body.productCode }});
    if(common.getEmpty(req.body.Mcate))
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate))
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.keyword))
        body.query.bool.filter.push({ term : { keyword : req.body.keyword }});

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
        		ifId : test[i][1]._source.ifId
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