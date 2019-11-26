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
winston.loggers.add("customer", winstonConfig.createLoggerConfig("customer"));
var logger = winston.loggers.get("customer");

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00601");
    let age = parseInt( req.body.age ); // 전체일 경우 어떤 값으로 오는지 확인?
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    var index = common.getIndex(req.body.channel);

    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    if(common.getEmpty(req.body.gender))
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age))
        body.query.bool.filter.push({ range : { age : { gte : age - 9, lte : age }}});

    body.aggs.aggs_gender = {
		terms : {
            field : "gender"
        },
        aggs : {
            aggs_age : {
                histogram : {
					field : "age",
					interval : 10
				}
            }
        }
    }    

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult("10", "OK", "statistics_by_customer");
        result.data.count = resp.hits.total;
        result.data.result = [];
		var objArr = new Array();
		var objArr2 = new Array();
		
        logger.debug(resp.aggregations);
        for(i in resp.aggregations.aggs_gender.buckets){
            for( j in resp.aggregations.aggs_gender.buckets[i].aggs_age.buckets){
                var obj = {};
                obj.gender = resp.aggregations.aggs_gender.buckets[i].key;
                obj.division = resp.aggregations.aggs_gender.buckets[i].aggs_age.buckets[j].key;
                obj.count = resp.aggregations.aggs_gender.buckets[i].aggs_age.buckets[j].doc_count;
                //result.data.result.push(obj);
				objArr[j] = obj;
            }
			result.data.result.push(objArr);
			objArr = new Array();
        }
        res.send(result);
    }, function(err){
		logger.error("statistics_by_customer ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_customer");
        res.send(result);
    });
});


module.exports = router;