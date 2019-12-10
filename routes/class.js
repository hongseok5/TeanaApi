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
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    let size = req.body.size || 0;  // 통계쿼리는 버킷만
    let from = req.body.from || 1;
    let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : age, lte : age + 9}}});    
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.Mcate) && req.body.Mcate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.vdn) && req.body.vdn != "ALL")
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp) && req.body.vdnGrp != "ALL")
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
			if(common.getEmpty(req.body.product[p].productCode)) {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
    body.query.bool.must = [
        { bool : { should } }
    ]

    body.aggs.cate1_terms = {
        terms : {
            field : "analysisCateNm",
            size : 1000
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
		var objArr = new Array();
		var objArr2 = new Array();
        result.data.count = resp.aggregations.cate1_terms.buckets.length;
        var z = 0;
        for(i in resp.aggregations.cate1_terms.buckets){
        	z = parseInt(z)+parseInt(resp.aggregations.cate1_terms.buckets[i].doc_count);
        }
        
        for(j in resp.aggregations.cate1_terms.buckets){
        	var total = Math.ceil(parseInt(resp.aggregations.cate1_terms.buckets[j].doc_count)/parseInt(z)*100);
        	var obj = {
				key : "category",
        	   	category1Nm : resp.aggregations.cate1_terms.buckets[j].key,
        	   	count : resp.aggregations.cate1_terms.buckets[j].doc_count,
        	}
			objArr[j] = obj;
			var obj2 = {
				key : "avgTime",
        	   	category1Nm : resp.aggregations.cate1_terms.buckets[j].key,
        	   	avgTime : Math.round(resp.aggregations.cate1_terms.buckets[j].avd_value.value)
        	}
            objArr2[j] = obj2;
        }
		result.data.result.push(objArr);
		result.data.result.push(objArr2);
		
        res.send(result);
    }, function(err){
		logger.error("count_by_class ", err);
        var result = common.getResult("99", "ERROR", "count_by_class");
        res.send(result);
    });
    
});

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00202");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    let should = [];
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    let interval = req.body.interval || "week";
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : common.req.body.category }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : age, lte : age + 9}}});    
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.Mcate) && req.body.Mcate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.MD))
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(common.getEmpty(req.body.vdn) && req.body.vdn != "ALL")
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp) && req.body.vdnGrp != "ALL")
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
			if(common.getEmpty(req.body.product[p].productCode)) {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
    body.query.bool.must = [
        { bool : { should } }
    ];
    body.aggs.aggs_class = {
        terms : {
           field : "analysisCateNm",
		   size : 1000
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