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
winston.loggers.add("product", winstonConfig.createLoggerConfig("product"));
var logger = winston.loggers.get("product");

router.post("/list", function(req, res){
    logger.info("Router for IF_DMA_00501");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    let size = req.body.size || 10 ;
    let from = req.body.from || 1 ;
    console.log( req.body.size, req.body.from);
    let age = parseInt(req.body.age);
    var fields = ["no", "company", "companyNm", "productCode", "productNm", "Mcate", "McateNm", "mdId", "mdNm"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, fields);
    var index = common.getIndex(req.body.channel);
    var should = [];
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
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
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : age, lte : age + 9}}});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
			if(common.getEmpty(req.body.product[p].productCode)) {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
   
	// productCode가 있는 것만 추출
    body.query.bool.filter.push({ exists : { "field" : "productCode" }});

    body.query.bool.must = [
        { bool : { should } }
    ]

    body.aggs.aggs_product = {
        terms : {
            field : "productCode",
            min_doc_count : 0,
            size : 10000
        }
    }
  
    client.search({
        index,
        body 
    }).then(function(resp){
        var result = common.getResult("10", "OK", "list_by_product");
        result.data.count = resp.aggregations.aggs_product.buckets.length;
        result.data.result = [];
        //product_bucket = resp.hits.hits;
        product_bucket = resp.aggregations.aggs_product.buckets;
        for( i in resp.hits.hits){
            obj = resp.hits.hits[i]._source;   
            result.data.result.push(obj);
        }
        for( i in result.data.result){
            result.data.result[i].count = 0; 
            for( j in product_bucket){
                if( result.data.result[i].productCode == product_bucket[j].key){
                    result.data.result[i].count = product_bucket[j].doc_count;
                    break;
                }    
            }
        }

        res.send(result);
    }, function(err){
		logger.error("list_by_product ", err);
        var result = common.getResult("99", "ERROR", "list_by_product");
        res.send(result);
    });
});

module.exports = router;

