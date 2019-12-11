var express = require("express");
var router = express.Router();
const dateFormat = require('dateformat');
var client = require('../index');
var common = require('./common');
const rp = require('request-promise');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("keyword", winstonConfig.createLoggerConfig("keyword"));
var logger = winston.loggers.get("keyword");

client.ping({
    requestTimeout : 100
}, function(err){
    if (err){
        logger.error('elasticsearch connection down!');
    } else {
		logger.info('elasticsearch connection well');
    }
});

router.post("/top", function(req, res){
    logger.info("Router for IF_DMA_00101");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    let sumsize = parseInt(from)*parseInt(size);
    let resultsize = parseInt(sumsize)-parseInt(size);
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var should = [];
    var index = common.getIndex(req.body.channel);
    
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL") 
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
        body.query.bool.filter.push({ range : { age : { gte : age, lte : age + 9}}});
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
    if(common.getEmpty(req.body.vdnGrp) && req.body.vdnGrp != "ALL" )
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
    body.query.bool.should = should;
    body.aggs.aggs_top_keyword = {
        nested : {
            path : "keyword_count"   // field name
        },
        aggs : {
            top_keyword : {
                terms : {
                    field : "keyword_count.keyword",
                    size : 1000
                }
            }
        }
    }

    var index = common.getIndex(req.body.channel);

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult( "10", "OK", "top_keyword");
        result.data.count = resp.aggregations.aggs_top_keyword.top_keyword.buckets.length;
        result.data.result = [];
        test = Object.entries(resp.aggregations.aggs_top_keyword.top_keyword.buckets);
        var fornum = 0;
        if(sumsize < test.length){
        	fornum = sumsize;
        }else{
        	fornum = test.length;
        }
        for(var i=parseInt(resultsize); i<parseInt(fornum); i++){
        	var obj = {
    			key : test[i][1].key,	
    			doc_count : test[i][1].doc_count,
    			no : parseInt(i) + 1
        	}
        	result.data.result.push(obj);
        }
        res.send(result);
    }, function(err){
		logger.error("Router for IF_DMA_00101", err);
        var result = common.getResult( "99", "ERROR", "top_keyword");
        res.send(result);
    });
});

var topStatisticsResult;

router.post("/top/statistics", function(req, res){
    logger.info("Router for IF_DMA_00102");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var keyword = [];
    var interval = req.body.interval || "1D";
    var index = common.getIndex(req.body.channel);
    if(req.body.keyword == undefined || req.body.keyword == "" || req.body.keyword == null){
    	var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
		
		if(common.getEmpty(req.body.category) && req.body.category != "ALL")
			body.query.bool.filter.push({ term : { analysisCate : req.body.category }});		
		
    	body.aggs = {
    		keyword_count :{	
    			nested : {
    				path : "keyword_count"	 
    			},
    			aggs : {
    				aggs_name : {
    					terms : {
    						field : "keyword_count.keyword",
    						size : "5"
    					}
    				}
    			}
    		}
    	}
    	client.search({
            index,
            body
        }).then(function(resp){
        	test = Object.entries(resp.aggregations.keyword_count.aggs_name.buckets);
        	if(test.length > 1){
        		topStatisticsResult = common.getResult( "10", "OK", "top_statistics_keyword");
            	topStatisticsResult.data.count = 0;
            	topStatisticsResult.data.result = [];
            	for(i in test){
            		topKeyword(test[i][1].key, req, res, test.length);
                }
        	}else{
        		topStatisticsResult = common.getResult( "20", "NODATA", "top_statistics_keyword");
        		res.send(topStatisticsResult);
        	}
        }, function(err){
        	topStatisticsResult = common.getResult( "99", "ERROR", "top_statistics_keyword");
        	res.send(topStatisticsResult);
        });
    }else{
    	topStatisticsResult = common.getResult( "10", "OK", "top_statistics_keyword");
    	topStatisticsResult.data.count = 0;
    	topStatisticsResult.data.result = [];
    	var finStr = "";
    	for(i in req.body.keyword){
    		topKeyword(req.body.keyword[i], req, res, req.body.keyword.length);
    	}
    }
    
});

function topKeyword(keyword, req, res, rownum){
	var interval = req.body.interval || "1D";
    var index = common.getIndex(req.body.channel);
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    	
	if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category}});

	
    body.query.bool.must = [
        { 
        	bool : {
        		should : [{
        			nested : {
        				path : "keyword_count",
        					query : {
        						bool : {
        							must : {
        								term : {
        									"keyword_count.keyword" : keyword 
        								}
        							}
        						}
        					}
        			}
        		}]
        	}
        }
    ];
    body.aggs = {
    	division :{	
    		date_histogram : {
    			field : "startTime",
    			interval : interval
    		}
    	}
    }
    client.search({
        index,
        body
    }).then(function(resp){
    	test = Object.entries(resp.aggregations.division.buckets);
    	var dayList = common.getDays(req.body.start_dt, req.body.end_dt, interval);
    	var obj2 = new Array();
    	for(k in dayList){
    		var obj = {
    		  	key : dayList[k].key,	
    		   	word : keyword,
    		   	count : 0
    		}
    		obj2[k] = obj;	
    	}
    	
    	for(i in test){
    		for(j in dayList){
    			if(dayList[j].key == test[i][1].key_as_string){
    				obj2[j].count = test[i][1].doc_count;	
    			}
    		}
        	topStatisticsResult.data.count = topStatisticsResult.data.count+test[i][1].doc_count;
        	
	    }
    	topStatisticsResult.data.result.push(obj2);
        if(topStatisticsResult.data.result.length == rownum){
			res.send(topStatisticsResult);
		}
    }, function(err){
		logger.error("top_statistics_keyword", err);
    	topStatisticsResult = common.getResult( "99", "ERROR", "top_statistics_keyword");
    	res.send(topStatisticsResult);
    });
}

router.post("/hot/count", function(req, res){
    logger.info("Router for IF_DMA_00103");

    let size = req.body.size || 10;
    //let from = req.body.from || 1;
    //let sumsize = parseInt(from)*parseInt(size);
    //let result_size = parseInt(sumsize)-parseInt(size) || 10;
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    var hour_ago = new Date().getHours() - 1 ;
    var two_hour = new Date().getHours() - 2 ;
    hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + now.slice(10, 14);
    two_hour = now.slice(0,8) + ( two_hour < 10 ? "0" + two_hour : two_hour ) + now.slice(10, 14);
    var body = common.getBodyNoSize( two_hour, now);   // 실제로는 hour_ago, hour_after로 넣고 테스트 시에는 하드코딩값 or 임의값 전달

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});

    body.aggs.rt_hot_keyword = {
        range : {
            field : "startTime",
            ranges : [
             { from : two_hour, to : hour_ago },
             { from : hour_ago, to : now }
         
            ]
        },
        aggs : {
            keyword_count : {
                nested : {
                    path : "keyword_count"   
                },
                aggs : {
                    aggs_name : {
                        terms : {
                            field : "keyword_count.keyword",
                            size : 1000
                        }
                    }
                }
            }
        }
    }
    
    // client.msearch()
    var index = common.getIndex(req.body.channel);
    client.search({
        index,
        body
    }).then(function(resp){
        if( resp.aggregations.rt_hot_keyword.buckets.length === 2 ){

            // 현재시간, 전시간으로 정렬
            resp.aggregations.rt_hot_keyword.buckets = resp.aggregations.rt_hot_keyword.buckets.sort( function(a, b){
                return a.from > b.from ? -1 : a.from < b.from ? 1 : 0;
            });
            
            // 키갑 비교 이중 포문
            let current_words = resp.aggregations.rt_hot_keyword.buckets[0].keyword_count.aggs_name.buckets;
            let before_words = resp.aggregations.rt_hot_keyword.buckets[1].keyword_count.aggs_name.buckets;
            
            for( i in current_words ){
                for( j in before_words ){
                    if( current_words[i].key === before_words[j].key){
                        current_words[i].before_count = before_words[j].doc_count;
                        current_words[i].gap = current_words[i].doc_count - before_words[j].doc_count;
                        current_words[i].updown = common.getUpdownRate(before_words[j].doc_count, current_words[i].doc_count );
                        break;

                    } else {
                        current_words[i].before_count = 0;
                        current_words[i].gap = current_words[i].doc_count;
                        current_words[i].updown = "new";
                    }
                }
            }
            // gap 순으로 정렬
            current_words = current_words.sort( function(a, b){
                return a.gap > b.gap ? -1 : a.gap < b.gap ? 1 : 0;
            });
            if( current_words.length > size ){
                current_words = current_words.slice(0, size);
            }
            // 번호부여
            for ( i in current_words){
                current_words[i].no = parseInt(i) + 1;
            }
            
            // 결과전송
            let result = common.getResult( "10", "OK", "top_keyword");
            result.data.count = current_words.length;
            result.data.result = current_words;
            res.send(result);
            
        } else {
            let result = common.getResult( "20", "NO DATA", "hot_count");
            result.data.count = 0;
            res.send(result);
        }
 
    }, function(err){
        logger.error("hot_count", err);
        hotStatisticsResult = common.getResult("99", "ERROR", "hot_count");
        res.send(hotStatisticsResult);
    });


});

router.post("/hot/statistics", function(req, res){
    logger.info("Router for IF_DMA_00104");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
	var two_ago = new Date().getHours() - 2 ;
	var hour_ago = new Date().getHours() - 1 ;
	var now_ago = new Date().getHours();
	two_ago = now.slice(0,8) + ( two_ago < 10 ? "0" + two_ago : two_ago )+now.slice(10,14);
	hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago )+now.slice(10,14);
	now_ago = now.slice(0,8) + ( now_ago < 10 ? "0" + now_ago : now_ago )+now.slice(10,14);
	var body = common.getBodyNoSize(two_ago, now_ago);
	var index = common.getIndex(req.body.channel);
	
	if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});

    if(common.getEmpty(req.body.keyword)){
    	var keyobj = new Array();
    	for(i in req.body.keyword){
    		keyobj[i] = req.body.keyword[i].word;
    	}
    	body.query.bool.must = [
        	{ 
              	bool : {
               		should : [{
               			nested : {
               				path : "keyword_count",
               					query : {
               						bool : {
               							must : {
               								terms : {
               									"keyword_count.keyword" : keyobj 
               								}
               							}
               						}
               					}
               			}
               		}]
               	}
            }
        ];
    }
    
    body.aggs.rt_hot_keyword = {
	        range : {
	            field : "startTime",
	            ranges : [
	             { from : two_ago, to : hour_ago },
	             { from : hour_ago, to : now_ago }
	         
	            ]
	        },
	        aggs : {
	            keyword_count : {
	                nested : {
	                    path : "keyword_count"   
	                },
	                aggs : {
	                    aggs_name : {
	                        terms : {
	                            field : "keyword_count.keyword",
	                            size : 1000
	                        }
	                    }
	                }
	            }
	        }
	    }
		
	client.search({
        index,
        body
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "top_keyword");
        result.data.count = 0;
        result.data.result = [];
        if( resp.aggregations.rt_hot_keyword.buckets.length === 2 ){
        	// 현재시간, 전시간으로 정렬
            resp.aggregations.rt_hot_keyword.buckets = resp.aggregations.rt_hot_keyword.buckets.sort( function(a, b){
                return a.from > b.from ? -1 : a.from < b.from ? 1 : 0;
            });
            
            // 키갑 비교 이중 포문
            let current_words = resp.aggregations.rt_hot_keyword.buckets[0].keyword_count.aggs_name.buckets;
            let before_words = resp.aggregations.rt_hot_keyword.buckets[1].keyword_count.aggs_name.buckets;
            
            for( i in current_words ){
                for( j in before_words ){
                    if( current_words[i].key === before_words[j].key){
                        current_words[i].before_count = before_words[j].doc_count;
                        current_words[i].gap = current_words[i].doc_count - before_words[j].doc_count;
                        current_words[i].updown = common.getUpdownRate(before_words[j].doc_count, current_words[i].doc_count );
                        break;

                    } else {
                        current_words[i].before_count = 0;
                        current_words[i].gap = current_words[i].doc_count;
                        current_words[i].updown = "new";
                    }
                }
            }
            // gap 순으로 정렬
            current_words = current_words.sort( function(a, b){
                return a.gap > b.gap ? -1 : a.gap < b.gap ? 1 : 0;
            });
            
            var beforobj = new Array();
            var newobj = new Array();
            
            if(common.getEmpty(req.body.keyword)){
            	for(k in req.body.keyword){
                	var obj = {
            		   	key : "before",	
            			word : req.body.keyword[k].word,	
            		  	count : 0,
            		}
            		var obj2 = {
            		   	key : "current",	
            		   	word : req.body.keyword[k].word,	
            		   	count : 0,
            		}
            		beforobj[k] = obj;
            		newobj[k] = obj2;
                }
            	for ( i in current_words){
            		for(j in beforobj){
                		if(current_words[i].key == beforobj[j].word){
                			beforobj[j].count = current_words[i].before_count;
                			newobj[j].count = current_words[i].doc_count;
                		}
                	}
            	}
            }else{
            	for ( i in current_words){
            		if(i <= 4){
                		var obj = {
                		   	key : "before",	
                			word : current_words[i].key,	
                		  	count : current_words[i].before_count,
                		}
                		var obj2 = {
                		   	key : "current",	
                		   	word : current_words[i].key,	
                		   	count : current_words[i].doc_count,
                		}
                		beforobj[i] = obj;
            			newobj[i] = obj2;
             		}
            	}
            	
            }
            
            result.data.result.push(beforobj);
            result.data.result.push(newobj);
            res.send(result);
        }else{
        	result = common.getResult( "20", "NODATA", "hot_statistics");
    		res.send(result);
        }
    }, function(err){
		logger.error("hot_statistics", err);
		result = common.getResult("99", "ERROR", "hot_statistics");
    	res.send(result);
    });
});

router.post("/relation", function(req, res){
    logger.info("Router for IF_DMA_00105");
    var rel_word_option = {
        uri : 'http://10.253.42.122:12800/kwd_to_kwd',
        method : "POST",
        body : {
            keyword : [],
            t_vec : "wv_common_1203",
            size : 10
        },
        json : true
    }
	
    if(common.getEmpty(req.body.keyword)){
    	rel_word_option.body.keyword.push(req.body.keyword.replace( /(\s*)/g ,""));
        /*
        if( typeof req.body.keyword == "string"){
            rel_word_option.body.keyword.push(req.body.keyword);
        } else {
            for(i in req.body.keyword ){
                rel_word_option.body.keyword.push(req.body.keyword[i]);
            }
        }
        */
        if(common.getEmpty(req.body.size))
            rel_word_option.body.size = req.body.size;
        console.log(rel_word_option);
        rp(rel_word_option).then(function(data){
            let result = common.getResult("10", "OK", "relation_keyword");
            data.output = data.output.sort( function(a, b){
                return a.similarity > b.similarity ? -1 : a.similarity < b.similarity ? 1 : 0;
            });
            for ( i in data.output ){
                data.output[i].no = parseInt(i) + 1;
                data.output[i].similarity = data.output[i].similarity.toString();
            }
            result.data.result = data.output;
            result.data.count = data.output.length;
            res.send(result);
        }).catch(function(err){
    		logger.error("relation_keyword", err);
            let result = common.getResult("99", "ERROR", "relation_keyword");
            res.send(result);
        });
    }else{
    	let result = common.getResult("40", "OK", "There is no required keyword");
    	res.send(result);
    }
});

router.post("/issue/top", function(req, res){
	logger.info("Router for IF_DMA_00108");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    var dayList = common.getDays(req.body.start_dt, req.body.end_dt, interval);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});

    if(common.getEmpty(req.body.keyword)){
        var nest_obj = {
            nested : {
                path : "keyword_count",
                query : {
                    terms : {
                        "keyword_count.keyword" : req.body.keyword
                    }
                }
            }
        }
        body.query.bool.filter.push(nest_obj);
    }else{
    	var result = common.getResult("40", "OK", "There is no required keyword");
    	res.send(result);
    }

    body.aggs.keyword_top = {
    	nested: {
            path: "keyword_count"
         },
         aggs: {
            aggs_name: {
             terms: {
             field: "keyword_count.keyword",
             size : "1000"
             	}
             }
         }
    }

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult("10", "OK", "issue_top_keyword");
        result.data.count = resp.aggregations.keyword_top.aggs_name.buckets.length;
        result.data.result = [];
        var z = 0;
        for(i in resp.aggregations.keyword_top.aggs_name.buckets){
        	for(j in req.body.keyword){
        		if(resp.aggregations.keyword_top.aggs_name.buckets[i].key == req.body.keyword[j].word){
        			z = parseInt(z)+1;
        			var obj = {
                		no : z,
                		word : req.body.keyword[j].word,
                		count : resp.aggregations.keyword_top.aggs_name.buckets[i].doc_count
                	}
        			result.data.result.push(obj);
        		}
    		}
        }
        res.send(result);
    }, function(err){
		logger.error("issue_top_keyword", err);
        var result = common.getResult("99", "ERROR", "issue_top_keyword");
        res.send(result);
    });
});

router.post("/issue", function(req, res){

    logger.info("Router for IF_DMA_00106");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    var dayList = common.getDays(req.body.start_dt, req.body.end_dt, interval);
   
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});

    if(common.getEmpty(req.body.keyword)){
        var nest_obj = {
            nested : {
                path : "keyword_count",
                query : {
                    term : {
                        "keyword_count.keyword" : req.body.keyword
                    }
                }
            }
        }
        body.query.bool.filter.push(nest_obj);
    }else{
    	var result = common.getResult("40", "OK", "There is no required keyword");
    	res.send(result);
    }

    body.aggs.keyword_hist = {
        date_histogram : {
            field : "startTime",
            interval : interval
        }
    }

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult("10", "OK", "issue_keyword");
        result.data.count = resp.aggregations.keyword_hist.buckets.length;
        result.data.interval = req.body.interval;
        result.data.result = [];
        for(j in dayList){  
        	var obj = {
    		   	key : dayList[j].key,	
    		   	word : req.body.keyword,
    		   	count : 0
    		}
        	for(i in resp.aggregations.keyword_hist.buckets){
        		if(dayList[j].key == resp.aggregations.keyword_hist.buckets[i].key_as_string){
    				obj.count = resp.aggregations.keyword_hist.buckets[i].doc_count;
    			}
    		}
        	result.data.result.push(obj);
        }

        res.send(result);
    }, function(err){
		logger.error("issue_keyword", err);
        var result = common.getResult("99", "ERROR", "issue_keyword");
        res.send(result);
    });
});

router.post("/issue/statistics", function(req, res){
    // 데이터 준비 필요
    logger.info("Router for IF_DMA_00107");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var index = common.getIndex(req.body.channel);

    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});

    if(common.getEmpty(req.body.keyword)){
    	 var nest_obj = {
    	            nested : {
    	                path : "keyword_count",
    	                query : {
    	                    term : {
    	                        "keyword_count.keyword" : req.body.keyword
    	                    }
    	                }
    	            }
    	        }
    	        body.query.bool.filter.push(nest_obj);
    }else{
    	var result = common.getResult("40", "OK", "There is no required keyword");
    	res.send(result);
    }

    body.aggs = {
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

    client.search({
        index,
        body
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "keyword_issue_statistics");
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
		logger.error("issue_keyword", err);
        var result = common.getResult("99", "ERROR", "issue_keyword");
        res.send(result);
    });
});

module.exports = router;