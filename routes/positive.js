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
winston.loggers.add("positive", winstonConfig.createLoggerConfig("positive"));
var logger = winston.loggers.get("positive");

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00402");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    // 긍,부정어 추이
    // let interval = req.body.interval || undefined;  
    var interval = req.body.interval || "1D";
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    var dayList = common.getDays(req.body.start_dt.toString(), req.body.end_dt.toString(), interval);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category}});
	
        body.aggs.division = {
        	date_histogram : {
        		field : "startTime",
        		interval : interval,
                min_doc_count : 1
               },
        	aggs : {
        		neutral : {
        				nested : {
        	                path : "neutral_word"
        	            },
        	            aggs : {
        	                aggs_name : {
        	                    terms : {
        	                        field : "neutral_word.word"
        	                    }
        	                }
        	            }	
        		},
        		positive : {
        	            nested : {
        	                path : "positive_word"
        	            },
        	            aggs : {
        	            	aggs_name : {
        	            		terms : {
        	                        field : "positive_word.word"
        	                    }
        	                }
        	            }
        		},
        		negative : {
        	            nested : {
        	                path : "negative_word"
        	            },
        	            aggs : {
        	            	aggs_name : {
        	            		terms : {
        	                        field : "negative_word.word"
        	                    }
        	                }
        	            }
        	    }
        	}
            
        };
    	
    var index = common.getIndex(req.body.channel);

    client.search({
        index,
        body
    }).then(function(resp){
    	var result = common.getResult("10", "OK", "statistics_by_positive")
        result.data.count = 0;
        result.data.result = [];
        test = Object.entries(resp.aggregations.division.buckets);
        var objarr1 = new Array();
        var objarr2 = new Array();
        var objarr3 = new Array();
        for(j in dayList){
        	var obj = {
        	        key : dayList[j].key,
        	        division : "negative",
        	        count : 0
        	    }
    			objarr1[j]=obj;
        	        	
        	    var obj2 = {
        	        key : dayList[j].key,
        	        division : "neutral",
        	        count : 0
        	    }
        	    objarr2[j]=obj2;
        	        	
        	    var obj3 = {
        	        key : dayList[j].key,
        	        division : "positive",
        	        count : 0
        	    }
        	    objarr3[j]=obj3;
        }
        
        for(i in test){
        	for(k in dayList){
        		if(dayList[k].key == test[i][1].key_as_string){
        			objarr1[k].count=test[i][1].negative.doc_count;
        	        objarr2[k].count=test[i][1].neutral.doc_count;
        	        objarr3[k].count=test[i][1].positive.doc_count;
        		}
        	}
        }
        
        result.data.result.push(objarr1);
        result.data.result.push(objarr2);
        result.data.result.push(objarr3);
        
        // 인터페이스에서 삭제
        for( i in result.data.result ){
            if(result.data.result[i].count > 0){
                result.data.count++;
            }
        }

        res.send(result);
    }, function(err){
		logger.error("statistics_by_positive ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_positive");
        res.send(result);
    });
});

router.post("/count", function(req, res){
    logger.info("Router for IF_DMA_00401");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    // 긍,부정어 현황
    // neg, pos, neu 3개 필드만 sum 해서 비유을 구하는지?
    let should = [];
    var index = common.getIndex(req.body.channel);
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0, from);
    
    body.aggs.neutral = {
        nested : {
            path : "neutral_word"
        },
        aggs : {
            count : {
                value_count : {
                    field : "neutral_word"
                }
            }
        }
    };
    body.aggs.positive = {
        nested : {
            path : "positive_word"
        },
        aggs : {
            count : {
                value_count : {
                    field : "positive_word"
                }
            }
        }
    };
    body.aggs.negative = {
        nested : {
            path : "negative_word"
        },
        aggs : {
            count : {
                value_count : {
                    field : "negative_word"
                }
            }
        }
    };

    var index = common.getIndex(req.body.channel);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : parseInt(req.body.age), lte : parseInt(req.body.age) + 9}}});    
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.mCate)&& req.body.mCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mCate }});
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
			if(common.getEmpty(req.body.product[p].productCode)) {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
    body.query.bool.must = [
        { bool : { should } }
    ];

    body.query.bool.should = [] // exist
    client.search({
        index,
        body
    }).then(function(resp){
        
        var result = common.getResult("10", "OK", "count_by_positive")
        result.data.result = {} ;
    	result.data.result.negative = [];
    	result.data.result.neutral = [];
    	result.data.result.positive = [];
        var totalMax = parseInt(resp.aggregations.negative.doc_count)+parseInt(resp.aggregations.neutral.doc_count)+parseInt(resp.aggregations.positive.doc_count); 
        result.data.count = totalMax;
        var obj = {
        	division : "negative",
            count : resp.aggregations.negative.doc_count,
            rate : Math.round((resp.aggregations.negative.doc_count/parseInt(totalMax))*100)
        }
       	result.data.result.negative.push(obj);
        var obj1 = {
           	division : "neutral",
            count : resp.aggregations.neutral.doc_count,
            rate : Math.round((resp.aggregations.neutral.doc_count/parseInt(totalMax))*100)
        }
        result.data.result.neutral.push(obj1);
        var obj2 = {
           	division : "positive",
            count : resp.aggregations.positive.doc_count,
            rate : Math.round((resp.aggregations.positive.doc_count/parseInt(totalMax))*100)
        }
        result.data.result.positive.push(obj2);
        res.send(result);

    }, function(err){
		logger.error("count_by_positive ", err);
        var result = common.getResult("99", "ERROR", "count_by_positive");
        res.send(result);
    });
});

router.post("/keyword", function(req, res){
    logger.info("Router for ");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    // 긍,부정어 현황
    // neg, pos, neu 3개 필드만 sum 해서 비유을 구하는지?
    let should = [];
    var index = common.getIndex(req.body.channel);
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0, from);
    
    if(common.getEmpty(req.body.division)){
    	if(req.body.division == "neutral"){
    		body.aggs.division = {
    		        nested : {
    		            path : "neutral_word"
    		        },
    		        aggs : {
    		            count : {
    		            	terms : {
    		                    field : "neutral_word.word",
    		                    size : 5
    		                }
    		            }
    		        }
    		    };
    	}else if(req.body.division == "positive"){
    		body.aggs.division = {
    		        nested : {
    		            path : "positive_word"
    		        },
    		        aggs : {
    		            count : {
    		            	terms : {
    		                    field : "positive_word.word",
    		                    size : 5
    		                }
    		            }
    		        }
    		    };
    	}else if(req.body.division == "negative"){
    		body.aggs.division = {
    		        nested : {
    		            path : "negative_word"
    		        },
    		        aggs : {
    		            count : {
    		            	terms : {
    		                    field : "negative_word.word",
    		                    size : 5
    		                }
    		            }
    		        }
    		    };
    	}else{
    		var result = common.getResult("40", "OK", "There is no required start_dt");
        	res.send(result);
    	}
    }else{
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }

    var index = common.getIndex(req.body.channel);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : parseInt(req.body.age), lte : parseInt(req.body.age) + 9}}});    
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.mCate)&& req.body.mCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mCate }});
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
			if(common.getEmpty(req.body.product[p].productCode)) {
				var term_obj = { term : { productCode : req.body.product[p].productCode}};
				should.push(term_obj);
			}
        } 
    }
    body.query.bool.must = [
        { bool : { should } }
    ];

    body.query.bool.should = [] // exist
    client.search({
        index,
        body
    }).then(function(resp){
        
        var result = common.getResult("10", "OK", "count_by_positive")
        result.data.result = {} ;
    	result.data.result.divison = [];
    	test = Object.entries(resp.aggregations.division.count.buckets);
    	
    	for(i in test){
    		var z = parseInt(i)+1;
    		var obj = {
    			key : test[i][1].key,	
        		count : test[i][1].doc_count,
        		no : z
    		}
    		result.data.result.divison.push(obj);
        }
        res.send(result);

    }, function(err){
		logger.error("count_by_positive ", err);
        var result = common.getResult("99", "ERROR", "count_by_positive");
        res.send(result);
    });
});


module.exports = router;