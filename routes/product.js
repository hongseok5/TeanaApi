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
    //logger.info("Router for IF_DMA_00501" + JSON.stringify(req.body));
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
    let size = req.body.size || 10 ;
    let from = req.body.from || 1 ;

    var fields = [ "company", "companyNm", "productCode", "productNm", "Mcate", "McateNm", "mdId", "mdNm"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 10000, 1, fields);
    var index = common.getIndex(req.body.channel);
    var should = [];
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.mCate) && req.body.mCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mCate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.mdNm))
        body.query.bool.filter.push({ term : { mdNm : req.body.mdNm }});
    if(common.getEmpty(req.body.vdn) && req.body.vdn != "ALL")
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(common.getEmpty(req.body.vdnGrp) && req.body.vdnGrp != "ALL")
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : Number(req.body.age), lte : Number(req.body.age) + 9}}});
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

	body.query.bool.must_not = { "term": { "productCode": ""}};
    body.sort = { startTime : "desc"};
    body.aggs.aggs_product = {
        terms : {
            field : "productCode",
            min_doc_count : 1,  //default, could be higher if buckets more than 10,000
            size : 10000
        }
    }
    
    var result = common.getResult(null, null, "list_by_product");
    result.data.result = [];
    
    let tmp_array = [];
    let p_count = 0;
    let scroll_sum = 0;
    client.search({
        index,
        body,
        scroll : "10s"    
    }, function getMoreUntilEnd(err, resp){
        if(err){
            result.status.code = "99";
            result.status.message = "ERROR"
            res.send(result);
        }
        scroll_sum += resp.hits.hits.length;
        if( resp.aggregations !== undefined){
            // first resp
            result.data.count = resp.aggregations.aggs_product.buckets.length;
            if(resp.aggregations.aggs_product.buckets.length == 0){
                result.status.code = "10";
                result.status.message = "OK"
                res.send(result);
                return;
            } else if( resp.aggregations.aggs_product.buckets.length > 10){
                size = Number(size);
                from = Number(from);
                tmp_array = resp.aggregations.aggs_product.buckets.slice( (from-1) * size, (from-1) * size + size);  // 페이징
            } else {
                tmp_array = resp.aggregations.aggs_product.buckets
            }
            
            for( i in tmp_array){
                for( j in resp.hits.hits){
                    if( tmp_array[i].key === resp.hits.hits[j]._source.productCode ){
                        let obj = {};
                        obj.company = resp.hits.hits[j]._source.company;
                        obj.companyNm = resp.hits.hits[j]._source.companyNm;
                        obj.productCode = resp.hits.hits[j]._source.productCode;
                        obj.productNm = resp.hits.hits[j]._source.productNm;
                        obj.Mcate = resp.hits.hits[j]._source.Mcate;
                        obj.McateNm = resp.hits.hits[j]._source.McateNm;
                        obj.mdId = resp.hits.hits[j]._source.mdId;
                        obj.mdNm = resp.hits.hits[j]._source.mdNm;
                        obj.count = tmp_array[i].doc_count;
                        result.data.result.push(obj);
                        p_count++;
                        break;
                    }
                }
            }
            if( scroll_sum < resp.hits.total  && p_count < tmp_array.length){
                client.scroll({
                    scrollId : resp._scroll_id,
                    scroll: "10s"
                }, getMoreUntilEnd);
            } else {
                result.status.code = "10";
                result.status.message = "OK"
                res.send(result);
            }
        } else {
            // scroll response
            for( i in tmp_array){
                for( j in resp.hits.hits){
                    if( tmp_array[i].key === resp.hits.hits[j]._source.productCode ){
                        let obj = {};
                        obj.company = resp.hits.hits[j]._source.company;
                        obj.companyNm = resp.hits.hits[j]._source.companyNm;
                        obj.productCode = resp.hits.hits[j]._source.productCode;
                        obj.productNm = resp.hits.hits[j]._source.productNm;
                        obj.Mcate = resp.hits.hits[j]._source.Mcate;
                        obj.McateNm = resp.hits.hits[j]._source.McateNm;
                        obj.mdId = resp.hits.hits[j]._source.mdId;
                        obj.mdNm = resp.hits.hits[j]._source.mdNm;
                        obj.count = tmp_array[i].doc_count;
                        result.data.result.push(obj);
                        p_count++;
                        break;
                    }
                }
            }
            if( scroll_sum < resp.hits.total && p_count < tmp_array.length){
                client.scroll({
                    scrollId : resp._scroll_id,
                    scroll: "10s"
                }, getMoreUntilEnd);
            } else {
                result.data.result = result.data.result.sort( function(a, b){
                    return a.count > b.count ? -1 : a.count < b.count ? 1 : 0;  // 상품 건수별 정렬
                });
                result.status.code = "10";
                result.status.message = "OK"
                res.send(result);
            }
        }
    });
});

module.exports = router;

