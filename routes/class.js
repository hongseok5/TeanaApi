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
winston.loggers.add("class", winstonConfig.createLoggerConfig("class"));
var logger = winston.loggers.get("class");

router.post("/count", function(req, res){
    logger.info("Router for IF_DMA_00201");

    let size = req.body.size || 0;  // 통계쿼리는 버킷만
    let from = req.body.from || 1;
    let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);

    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(common.getEmpty(req.body.age))
        body.query.bool.filter.push({ term : { age : req.body.age }});    
    if(common.getEmpty(req.body.gender))
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.Mcate))
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate))
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.vdn))
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp))
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product.productCode ){
            var term_obj = { term : { productCode : req.body.productCode[p]}};
            should.push(term_obj);
        } 
    }
    
    body.query.bool.must = [
        { bool : { should } }
    ]

    body.aggs.cate1_terms = {
        terms : {
            field : "category1Nm",
            size : 10
        },
        aggs : {
            avd_value : { avg : { field : "duration" } }
        }
    }
    var index = common.getIndex(req.body.channel);

    client.search({
        index,
        body
    }).then(function(resp){
    	var result = common.getResult("10", "OK", "statistics_by_class");
    	result.data.result = [];
        result.data.count = resp.aggregations.cate1_terms.buckets.length;
        var z = 0;
        for(i in resp.aggregations.cate1_terms.buckets){
        	z = parseInt(z)+parseInt(resp.aggregations.cate1_terms.buckets[i].doc_count);
        }
        
        for(j in resp.aggregations.cate1_terms.buckets){
        	var total = Math.ceil(parseInt(resp.aggregations.cate1_terms.buckets[j].doc_count)/parseInt(z)*100);
        	var obj = {
        	   	category1Nm : resp.aggregations.cate1_terms.buckets[j].key,
        	   	count : resp.aggregations.cate1_terms.buckets[j].doc_count,
        	   	rate : total,
        	   	avgTime : Math.round(resp.aggregations.cate1_terms.buckets[j].avd_value.value)
        	}
            result.data.result.push(obj);
        }
        res.send(result);
    }, function(err){
		logger.error("count_by_class ", err);
        var result = common.getResult("99", "ERROR", "count_by_class");
        res.send(result);
    });
    
});

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00202");
	
    let should = [];
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    let interval = req.body.interval || "week";
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(common.getEmpty(req.body.age))
        body.query.bool.filter.push({ term : { age : req.body.age }});    
    if(common.getEmpty(req.body.gender))
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.Mcate))
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate))
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.vdn))
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp))
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product.productCode ){
            var term_obj = { term : { productCode : req.body.productCode[p]}};
            should.push(term_obj);
        } 
    }

    body.aggs.aggs_class = {
        terms : {
           field : "category1Nm"
        },
        aggs : {
            avd_value : { avg : { field : "duration" } }
        }
    }        

var index = common.getIndex(req.body.channel);
    client.search({
        index,
        body 
    }).then(function(resp){

        var result = common.getResult("10", "OK", "statistics_by_class");
        result.data.result = [];
        result.data.count = resp.aggregations.aggs_class.buckets.length;
        var z = 0;
        for(i in resp.aggregations.aggs_class.buckets){
        	z = parseInt(z)+parseInt(resp.aggregations.aggs_class.buckets[i].doc_count);
        	
        }
        
        for(j in resp.aggregations.aggs_class.buckets){
        	var total = Math.ceil(parseInt(resp.aggregations.aggs_class.buckets[j].doc_count)/parseInt(z)*100);
        	var obj = {
    		   	category1Nm : resp.aggregations.aggs_class.buckets[j].key,
    		   	count : resp.aggregations.aggs_class.buckets[j].doc_count,
    		   	rate : total,
    		   	avgTime : Math.round(resp.aggregations.aggs_class.buckets[j].avd_value.value)
    		}
        	result.data.result.push(obj);
        }
        res.send(result);

    }, function(err){
		logger.error("statistics_by_class ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_class");
        res.send(result);
    });
});

module.exports = router;