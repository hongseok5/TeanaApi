var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00402");
    // 긍,부정어 추이
    // let interval = req.body.interval || undefined;  
    var interval = req.body.interval || "1D";
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    var dayList = common.getDays(req.body.start_dt.toString(), req.body.end_dt.toString(), interval);

    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
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
        for(i in test){
        	for(k in dayList){
        		if(dayList[k].key == test[i][1].key_as_string){
        			var obj = {
        	            key : dayList[k].key,
        	            division : "negative",
        	            count : test[i][1].negative.doc_count
        	        }
        			objarr1[k]=obj;
        	        	
        	        var obj2 = {
        	            key : dayList[k].key,
        	            division : "neutral",
        	            count : test[i][1].neutral.doc_count
        	        }
        	        objarr2[k]=obj2;
        	        	
        	        var obj3 = {
        	            key : dayList[k].key,
        	            division : "positive",
        	            count : test[i][1].positive.doc_count
        	        }
        	        objarr3[k]=obj3;
        		}else{
        			var obj = {
            	        key : dayList[k].key,
            	        division : "negative",
            	        count : 0
            	    }
        			objarr1[k]=obj;
            	        	
            	    var obj2 = {
            	        key : dayList[k].key,
            	        division : "neutral",
            	        count : 0
            	    }
            	    objarr2[k]=obj2;
            	        	
            	    var obj3 = {
            	        key : dayList[k].key,
            	        division : "positive",
            	        count : 0
            	    }
            	    objarr3[k]=obj3;
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
        var result = common.getResult("99", "ERROR", "statistics_by_positive");
        res.send(result);
    });
});

router.post("/count", function(req, res){
    console.log("Router for IF_DMA_00401");
    // 긍,부정어 현황
    // neg, pos, neu 3개 필드만 sum 해서 비유을 구하는지?
    let should = [];
    var index = common.getIndex(req.body.channel);
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0, from);
    
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
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
	
    if(common.getEmpty(req.body.product)) {
		for( p in req.body.product.productCode ){
			var term_obj = { term : { productCode : req.body.productCode[p]}};
			should.push(term_obj);
		} 
	}
	
    body.query.bool.must = [
        { bool : {should}}
    ];

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
    
	if(common.getEmpty(req.body.product)) {
		for( p in req.body.product.productCode ){
			var term_obj = { term : { productCode : req.body.productCode[p]}};
			should.push(term_obj);  // should 쿼리 적용
		}
	}

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

        res.send(result);
    }, function(err){
        var result = common.getResult("99", "ERROR", "count_by_positive");
        res.send(result);
    });
});


module.exports = router;