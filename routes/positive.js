var express = require("express");
var router = express.Router();
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host : '10.253.42.185:9200',
    log: 'trace'
});
var common = require('./common');

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00402");
    // 긍,부정어 추이
    // let interval = req.body.interval || undefined;  
    let size = req.body.size || 0;
    var interval = req.body.interval || "1D";
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    

    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
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
        for(i in test){
        	var obj = {
                key : test[i][1].key_as_string,
                division : "negative",
                count : test[i][1].negative.doc_count
            }
            result.data.result.push(obj);
        	
        	var obj2 = {
                key : test[i][1].key_as_string,
                division : "neutral",
                count : test[i][1].neutral.doc_count
            }
            result.data.result.push(obj2);
        	
        	var obj3 = {
                key : test[i][1].key_as_string,
                division : "positive",
                count : test[i][1].positive.doc_count
            }
            result.data.result.push(obj3);
        }

        // 인터페이스에서 삭제
        for( i in result.data.result ){
            if(result.data.result[i].count > 0){
                result.data.count++;
            }
        }

        res.send(result);
    }, function(err){
        console.log(err);
    });
});

router.post("/count", function(req, res){
    console.log("Router for IF_DMA_00401");
    // 긍,부정어 현황
    // neg, pos, neu 3개 필드만 sum 해서 비유을 구하는지?
    let should = [];
    var index = common.getIndex(req.body.channel);
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0);
    
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.gender !== undefined)
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(req.body.company !== undefined)
        body.query.bool.filter.push({ term : { company : req.body.company }});
    if(req.body.Mcate !== undefined)
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(req.body.inCate !== undefined)
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(req.body.MD !== undefined)
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(req.body.vdn !== undefined)
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(req.body.vdnGrp !== undefined)
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    for( p in req.body.productCode ){
        var term_obj = { term : { productCode : req.body.productCode[p]}};
        should.push(term_obj);
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

    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    if(req.body.gender !== undefined)
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(req.body.company !== undefined)
        body.query.bool.filter.push({ term : { company : req.body.company }});
    if(req.body.Mcate !== undefined)
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(req.body.inCate !== undefined)
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(req.body.MD !== undefined)
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(req.body.vdn !== undefined)
        body.query.bool.filter.push({ term : { vdn : req.body.vdn }});
    if(req.body.vdnGrp !== undefined)
        body.query.bool.filter.push({ term : { vdnGrp : req.body.vdnGrp }});
    
    for( p in req.body.productCode ){
        var term_obj = { term : { productCode : req.body.productCode[p]}};
        should.push(term_obj);  // should 쿼리 적용
    } 
    body.query.bool.should = [] // exist
    client.search({
        index,
        body
    }).then(function(resp){
        
        var result = common.getResult("10", "OK", "count_by_positive")
        var total = resp.aggregations.neutral.doc_count + resp.aggregations.negative.doc_count + resp.aggregations.positive.doc_count;
        result.data.count = 0;
        result.data.result = [];
        test = Object.entries(resp.aggregations);
        for(i in test){
            var obj = {
                key : test[i][0],
                count : test[i][1].doc_count,
                rate : Math.round( test[i][1].doc_count / total * 100 )
            }
            result.data.result.push(obj);
        }

        // 인터페이스에서 삭제
        for( i in result.data.result ){
            if(result.data.result[i].count > 0){
                result.data.count++;
            }
        }

        res.send(result);
    }, function(err){
        console.log(err);
    });
});


module.exports = router;