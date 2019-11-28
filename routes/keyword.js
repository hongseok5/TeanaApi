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
    if(common.getEmpty(req.body.product)){
    	for( p in req.body.product ){
            var term_obj = { term : { productCode : req.body.product[p].productCode}};
            should.push(term_obj);
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
            	var finStr = "";
                for(i in test){
                	var keyNum = test.length;
                	keyNum--;
                	if(i == keyNum){
            			finStr = "Y";
            		}
                	topKeyword(test[i][1].key, req, res, finStr);
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
    		var keyNum = req.body.keyword.length;
        	keyNum--;
        	if(i == keyNum){
    			finStr = "Y";
    		}
    		topKeyword(req.body.keyword[i], req, res, finStr);
    	}
    }
    
});

function topKeyword(keyword, req, res, final){
	var interval = req.body.interval || "1D";
    var index = common.getIndex(req.body.channel);
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
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
    			interval : interval,
    			min_doc_count : "1"
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
    	for(i in test){
    		for(j in dayList){
    			if(dayList[j].key == test[i][1].key_as_string){
    				var obj = {
    		        	key : test[i][1].key_as_string,	
    		        	word : keyword,
    		        	count : test[i][1].doc_count
    		        }
    				obj2[j] = obj;	
    			}else{
    				var obj = {
        		       	key : dayList[j].key,	
        		       	word : keyword,
        		       	count : 0
        		    }
        			obj2[j] = obj;	
    			}
    		}
        	topStatisticsResult.data.count = topStatisticsResult.data.count+test[i][1].doc_count;
        	
	    }
        topStatisticsResult.data.result.push(obj2);
        if(final == "Y"){
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
    let interval = req.body.interval || "1H";
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    let sumsize = parseInt(from)*parseInt(size);
    let result_size = parseInt(sumsize)-parseInt(size) || 10;
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    var hour_ago = new Date().getHours() - 1 ;
    var hour_after = new Date().getHours() + 1 ;
    now = now.slice(0,10) + "0000";
    hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + "0000";
    hour_after = now.slice(0,8) + ( hour_after < 10 ? "0" + hour_after : hour_after ) + "0000";
    var body = common.getBodyNoSize(hour_ago, hour_after);   // 실제로는 hour_ago, hour_after로 넣고 테스트 시에는 하드코딩값 or 임의값 전달
    
    body.aggs.rt_hot_keyword = {
        date_histogram : {
            field : "startTime",
            interval : interval,
            order : {
                _key : "desc"
            }
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
                    },
                    aggs_avg : {
                        avg : {
                            field : "keyword_count.count"                           
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
    
        if ( resp.aggregations.rt_hot_keyword.buckets.length >= 2 ){
               time_result = resp.aggregations.rt_hot_keyword.buckets.slice(0,2);  // 실제로는 전시간, 현재시간으로 2개만 발생
               current_words = time_result[0].keyword_count.aggs_name.buckets;  // 현재 시간
               before_words = time_result[1].keyword_count.aggs_name.buckets;  //  전 시간
                /*
               current_words = current_words.sort( function(a, b){
                   return a.doc_count > b.doc_count ? -1 : a.doc_count < b.doc_count ? 1 : 0;
               });
               */
               for(i in current_words){
                   for(j in before_words){
                       if( current_words[i].key == before_words[j].key){    // 전 시간대에 같은 키 값이 있으면 
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
               
               current_words = current_words.sort( function(a, b){
                   return a.gap > b.gap ? -1 : a.gap < b.gap ? 1 : 0;
               });
               current_words = current_words.slice( 0, 100); // 페이징 안 하고 TOP 100개 한 꺼번에
              
            let result = common.getResult("10", "OK", "hot_count");
               result.data.count = current_words.length;
               result.data.result = current_words;
               res.send(result);
    
           } else if( resp.aggregations.rt_hot_keyword.buckets.length == 1){
               
               let result = common.getResult( "10", "OK", "hot_count");
               result.data.count = resp.aggregations.rt_hot_keyword.buckets[0].keyword_count.aggs_name.buckets.length;
               result.data.result = resp.aggregations.rt_hot_keyword.buckets[0].keyword_count.aggs_name.buckets;
               for(i in result.data.result){
                   result.data.result[i].updown = 100;
                   result.data.result[i].before_count = null;
               }
               res.send(result);
           } else {
               let result = common.getResult( "20", "NO DATA", "hot_count");
               result.data.count = 0;
               res.send(result);
           }
        
    }, function(err){
        logger.error("hot_count", err);
        let result = common.getResult("99", "ERROR", "hot_count");
        res.send(result);
    })
});

/*대역변수 /hot/statistics에서 키워드별로 한건씩 조회하여 값 셋팅
 * 키워드 별로 hotStatistics(키워드, req, res, 종료 여부) 호출 	
 * 키워드 수만큼 hotStatistics호출 후 hotStatisticsResult에 데이터 쌓아 놓음. */ 
var hotStatisticsResult;

router.post("/hot/statistics", function(req, res){
    logger.info("Router for IF_DMA_00104");
    hotStatisticsResult = common.getResult("10", "OK", "hot_statistics");
    hotStatisticsResult.data.result = [];
		
    if(common.getEmpty(req.body.keyword)){
    	hotStatisticsResult.data.count = req.body.keyword.length;
    	var finStr ="";
    	var keyNum = req.body.keyword.length;
    	keyNum--;
    	for(i in req.body.keyword){
    		if(i == keyNum){
    			finStr = "Y";
    		}
    		hotStatistics(req.body.keyword[i], req, res, finStr);
    	}
    }else{
    	var now = dateFormat(new Date(), "yyyymmddHHMMss");
    	var hour_ago = new Date().getHours() - 1 ;
    	var now_ago = new Date().getHours() + 1 ;
    	now = now.slice(0,10) + "0000";
    	hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + "0000";
    	now_ago = now.slice(0,8) + ( now_ago < 10 ? "0" + now_ago : now_ago ) + "0000";
    	var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    	var index = common.getIndex(req.body.channel);
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
        	var result = common.getResult( "10", "OK", "top_keyword");
            result.data.count = 0;
            result.data.result = [];
            test = Object.entries(resp.aggregations.keyword_count.aggs_name.buckets);
            if(test.length > 0){
            	var finStr = "";
                var keyNum = test.length;
            	keyNum--;
        		for(i in test){
            		if(i == keyNum){
            			finStr = "Y";
            		}
            		hotStatistics(test[i][1].key, req, res, finStr);
            	}
            }else{
            	topStatisticsResult = common.getResult( "20", "NODATA", "hot_statistics");
        		res.send(topStatisticsResult);
            }
        }, function(err){
			logger.error("hot_statistics", err);
        	hotStatisticsResult = common.getResult("99", "ERROR", "hot_statistics");
        	res.send(hotStatisticsResult);
        });
    }
});

function hotStatistics(keyword, req, res, final){
	var now = dateFormat(new Date(), "yyyymmddHHMMss");
	var hour_ago = new Date().getHours() - 1 ;
	var now_ago = new Date().getHours() + 1 ;
	now = now.slice(0,10) + "0000";
	hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + "0000";
	now_ago = now.slice(0,8) + ( now_ago < 10 ? "0" + now_ago : now_ago ) + "0000";
	var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
	var index = common.getIndex(req.body.channel);
	if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
	if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    
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
    	day : {
    		date_histogram : {
    			field : "startTime",
    			interval : "1H",
    			min_doc_count : "1"
    		}
    	}
    };
    body.sort = [
    	{startTime : "asc"}	
    ];
    
    client.search({
        index,
        body
    }).then(function(resp){
    	var obj = new Array();
    	var dateObj = new Array();
    	test = Object.entries(resp.aggregations.day.buckets);
    	for(i in test){
    		obj[i] = test[i][1].doc_count;
    		dateObj[i] = test[i][1].key_as_string;
    	}
    	var returnVal1 = 0;
    	var returnVal2 = 0;
    	if(dateObj[0] == now){
    		if(common.getEmpty(obj[0])){
        		returnVal1 = obj[0];
        	}
    	}
    	if(dateObj[0] == hour_ago){
    		if(common.getEmpty(obj[0])){
        		returnVal2 = obj[0];
        	}
    	}
    	if(dateObj[1] == now){
    		if(common.getEmpty(obj[1])){
        		returnVal1 = obj[0];
        	}
    	}
    	if(dateObj[1] == hour_ago){
    		if(common.getEmpty(obj[1])){
        		returnVal2 = obj[0];
        	}
    	}
    	var returnVal = {
			word : keyword,	
	       	count : returnVal1,
	        before_count : returnVal2
        }
		var obj = new Array();
		obj[0]=returnVal; 
		hotStatisticsResult.data.result.push(obj);
		if(final == "Y"){
			res.send(hotStatisticsResult);
		}
    }, function(err){
		logger.error("hot_statistics", err);
    	hotStatisticsResult = common.getResult("99", "ERROR", "hot_statistics");
    	res.send(hotStatisticsResult);
    });
}

router.post("/relation", function(req, res){
    logger.info("Router for IF_DMA_00105");
    var rel_word_option = {
        uri : 'http://localhost:12800/kwd_to_kwd',
        method : "POST",
        body : {
            keyword : [],
            t_vec : "mobile_test8",
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
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
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
        for(i in resp.aggregations.keyword_hist.buckets){
        	for(j in dayList){
    			if(dayList[j].key == resp.aggregations.keyword_hist.buckets[i].key_as_string){
    				var obj = {};
    	            obj.key = dayList[j].key;
    	            obj.count = resp.aggregations.keyword_hist.buckets[i].doc_count;
    	            obj.word = req.body.keyword;
    	            result.data.result.push(obj);
    			}else{
    				var obj = {
        		       	key : dayList[j].key,	
        		       	word : req.body.keyword,
        		       	count : 0
        		    }
    				result.data.result.push(obj);	
    			}
    		}
            
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
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
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