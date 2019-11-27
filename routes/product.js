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
    logger.info("Router for IF_DMA_00004");
    let size = req.body.size || 10 ;
    let from = req.body.from || 1 ;
    let age = parseInt(req.body.age);
    var fields = ["no", "company", "companyNm", "productCode", "productNm", "Mcate", "McateNm", "mdId", "mdNm"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, fields);
    var index = common.getIndex(req.body.channel);
    var should = [];
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
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
    if(common.getEmpty(req.body.gender))
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age))
        body.query.bool.filter.push({ range : { age : { gte : age-9, lte : age }}});
    if(common.getEmpty(req.body.product)) {
		for( p in req.body.product.productCode ){
			var term_obj = { term : { productCode : req.body.productCode[p]}};
			should.push(term_obj);
		} 
	}
	
	// productCode가 있는 것만 추출
	body.query.bool.filter.push({ exists : { "field" : "productCode" }});

    body.query.bool.must = [
        { bool : { should } }
    ]

    body.aggs.aggs_product = {
        terms : {
            field : "productCode"
        }
    }
  
    client.search({
        index,
        body 
    }).then(function(resp){
        var result = common.getResult("10", "OK", "list_by_product");
        result.data.count = resp.hits.total;
        result.data.result = [];

        product_bucket = resp.aggregations.aggs_product.buckets;
        for( i in resp.hits.hits){
            obj = resp.hits.hits[i]._source;
            result.data.result.push(obj);
        }
        for(i in product_bucket){
            for(j in result.data.result){
                if(product_bucket[i].key == result.data.result[j].productCode){
                    result.data.result[j].count = product_bucket[i].doc_count;
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

