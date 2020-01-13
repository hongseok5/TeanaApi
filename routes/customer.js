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
    let size = req.body.size || 10;
    let from = req.body.from || 1;
	let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    var index = common.getIndex(req.body.channel);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL") {
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
	}else{
		body.query.bool.filter.push({ terms : { gender : ["1","2"] }});
	}
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : parseInt(req.body.age), lte : parseInt(req.body.age) + 9}}});

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

/**
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
*/

    body.aggs.aggs_age = {
		histogram : {
			field : "age",
			interval : 10
		},
        aggs : {
            aggs_gender : {
                terms : {
					field : "gender"
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
		var objArr = new Array();	//1
		var objArr2 = new Array();	//2
		
        logger.debug(resp.aggregations);
/**        for(i in resp.aggregations.aggs_gender.buckets){
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
*/   

        for(i in resp.aggregations.aggs_age.buckets){
			if(resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets.length == 2) {
				for(j in resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets){
					var obj = {};
					obj.gender = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].key;
					obj.division = resp.aggregations.aggs_age.buckets[i].key;
					obj.count = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].doc_count;
					if(resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].key == "1") {
						objArr.push(obj);
					}else{
						objArr2.push(obj);
					}
				}
			}else{
				var obj = {};
				var obj2 = {};
				
				for(j in resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets){
					obj.gender = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].key;
					obj.division = resp.aggregations.aggs_age.buckets[i].key;
					obj.count = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].doc_count;
				}
				
				if(obj.gender == "1") {
					obj2.gender =  "2";
					obj2.division = obj.division;
					obj2.count = 0;
										
					objArr.push(obj);
					objArr2.push(obj2);
				}else if(obj.gender != undefined){
					obj2.gender =  "1";
					obj2.division = obj.division;
					obj2.count = 0;
										
					objArr.push(obj2);
					objArr2.push(obj);
				}
			}
        }
		
		result.data.result.push(objArr);
		result.data.result.push(objArr2);
		
		res.send(result);
    }, function(err){
		logger.error("statistics_by_customer ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_customer");
        res.send(result);
    });
});


module.exports = router;