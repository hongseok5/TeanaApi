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

var productResult;

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
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0, 1, fields);
    var index = common.getIndex(req.body.channel);
    var should = [];
    if(common.getEmpty(req.body.category) && req.body.category != "ALL") 
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
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
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : Number(req.body.age), lte : Number(req.body.age) + 9}}});
    if(req.body.orderYn == "Y" )
        body.query.bool.filter.push({ term : { category2 : "zz" }});
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
			if(common.getEmpty(req.body.product[p].productCode) && req.body.product[p].productCode != "ALL") {
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
	var body2 = body;
    body.aggs.aggs_product = {
        terms : {
            field : "productCode",
            min_doc_count : 1,  //default, could be higher if buckets more than 10,000
            size : 10000
        },
		  aggs : {
            agg_class : {
              filter: {
                term: {
                  "analysisCate": "0000000011"
                }
              }
            }
          }
    }
    
	body2.aggs.aggs_mcate = {
        terms : {
            field : "Mcate",
            min_doc_count : 1,  //default, could be higher if buckets more than 10,000
            size : 10000
        },
		  aggs : {
            agg_class : {
              filter: {
                term: {
                  "analysisCate": "0000000011"
                }
              }
            }
          }	
	}
	
    var result = common.getResult(null, null, "list_by_product");
    result.data.result = [];
    
    let tmp_array = [];
    let p_count = 0;
	
    client.msearch({
        index,
        body : [body, body2]   
    }).then(result => {

        if( result.responses[0].aggregations !== undefined){
            // first resp
			var cateData = result.responses[0].aggregations.aggs_mcate.buckets;
//			console.log("aggs_product:" + result.responses[0].aggregations.aggs_product.buckets.length);
            if(result.responses[0].aggregations.aggs_product.buckets.length == 0){
                result.status.code = "10";
                result.status.message = "OK"
                res.send(result);
                return;
            } else if( result.responses[0].aggregations.aggs_product.buckets.length > 10){
                size = Number(size);
                from = Number(from);
                tmp_array = result.responses[0].aggregations.aggs_product.buckets.slice( (from-1) * size, (from-1) * size + size);  // 페이징
            } else {
                tmp_array = result.responses[0].aggregations.aggs_product.buckets
            }
            
			productResult = common.getResult( "10", "OK", "list_by_product");
			productResult.data.count = result.responses[0].aggregations.aggs_product.buckets.length;
			productResult.data.result = [];
						
            for( i in tmp_array){
				searchName(tmp_array[i], req, res, tmp_array.length, cateData);			
            }
        }
    }).catch(error => {
		console.log ("error ", error);
		result.status.code = "99";
		result.status.message = "ERROR"
		res.send(result);
	});
});

function searchName(keyword, req, res, rownum, cateData){
	
	var source = [ "company", "companyNm", "productCode", "productNm", "Mcate", "McateNm", "mdId", "mdNm"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 1, 0, source);
    var index = common.getIndex(req.body.channel);
	
	body.query.bool.filter.push({ term : { productCode : keyword.key }})
	body.sort = {
        "companyNm" : "desc" // 파라미터로 받아서 정렬하기 
    }
	
    client.search({
        index,
        body
    }).then(function(resp){
    	test = Object.entries(resp.hits.hits);
        for(i in test){
			var cateRate;
			for(j in cateData) {
				if(test[i][1]._source.Mcate == cateData[j].key) {
					cateRate = Math.round(cateData[j].agg_class.doc_count/cateData[j].doc_count*100)
					break;
				}
			}
        	var obj = {
        		company : common.convertEmpty(test[i][1]._source.company),
        		companyNm : common.convertEmpty(test[i][1]._source.companyNm),
        		productCode : common.convertEmpty(test[i][1]._source.productCode),
        		productNm : common.convertEmpty(test[i][1]._source.productNm),
        		Mcate : test[i][1]._source.Mcate,
        		McateNm : test[i][1]._source.McateNm,
        		mdId : test[i][1]._source.mdId,
        		mdNm : test[i][1]._source.mdNm,
				count : keyword.doc_count,
				claimCount : keyword.agg_class.doc_count,
				claimRate : Math.round(keyword.agg_class.doc_count/keyword.doc_count*100),
				cateRate : cateRate
			}
			productResult.data.result.push(obj);
		}
		
        if(productResult.data.result.length == rownum){
			 productResult.data.result = productResult.data.result.sort( function(a, b){
                return a.count > b.count ? -1 : a.count < b.count ? 1 : 0;
            });
			res.send(productResult);
		}
    }, function(err){
		logger.error("list_by_product", err);
    	productResult = common.getResult( "99", "ERROR", "list_by_product");
    	res.send(productResult);
    });
}


module.exports = router;

