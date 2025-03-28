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
winston.loggers.add("order", winstonConfig.createLoggerConfig("order"));
var logger = winston.loggers.get("order");

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00801");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    	return;
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    	return;
    }
    let should = [];
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    let interval = req.body.interval || "week";
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : parseInt(req.body.age), lte : parseInt(req.body.age) + 9}}});    
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.mdCate) && req.body.mdCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mdCate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.mdNm))
        body.query.bool.filter.push({ term : { mdNm : req.body.mdNm }});
    if(common.getEmpty(req.body.vdn) && req.body.vdn != "ALL")
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp) && req.body.vdnGrp != "ALL")
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
			if(common.getEmpty(req.body.product[p].productCode) && req.body.product[p].productCode != "ALL") {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
	
    body.query.bool.filter.push({ term : { category2 : "zz" }});
    body.query.bool.must_not =  [
        { "match": {"reasonCate1Nm": ""} }
    ];
    body.query.bool.must = [
        { bool : { should } }
    ];
    body.aggs.aggs_class = {
        terms : {
           field : "reasonCate1Nm",
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

        var result = common.getResult("10", "OK", "statistics_by_order");
        result.data.result = [];
        result.data.count = resp.aggregations.aggs_class.buckets.length;
        var z = 0;
        for(i in resp.aggregations.aggs_class.buckets){
        	z = parseInt(z)+parseInt(resp.aggregations.aggs_class.buckets[i].doc_count);
        	
        }
        
        for(j in resp.aggregations.aggs_class.buckets){
        	var total = Math.ceil(parseInt(resp.aggregations.aggs_class.buckets[j].doc_count)/parseInt(z)*100);
        	var obj = {
        		reasonCate1Nm : resp.aggregations.aggs_class.buckets[j].key,
    		   	count : resp.aggregations.aggs_class.buckets[j].doc_count,
    		   	rate : total,
    		   	avgTime : Math.round(resp.aggregations.aggs_class.buckets[j].avd_value.value)
    		}
        	result.data.result.push(obj);
        }
        res.send(result);

    }, function(err){
		logger.error("statistics_by_order ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_order");
        res.send(result);
    });
});

module.exports = router;