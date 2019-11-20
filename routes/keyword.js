var express = require("express");
var router = express.Router();
const dateFormat = require('dateformat');
var client = require('../index');
var common = require('./common');


client.ping({
    requestTimeout : 100
}, function(err){
    if (err){
        console.trace('down!');
    } else {
        console.log('well');
    }
});

router.post("/top", function(req, res){
    console.log("Router for IF_DMA_00101");
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    let sumsize = parseInt(from)*parseInt(size);
    let resultsize = parseInt(sumsize)-parseInt(size);
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    var should = [];
    var index = common.getIndex(req.body.channel);
    
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
    body.query.bool.should = should;
    body.aggs.aggs_top_keyword = {
        nested : {
            path : "keyword_count"   // field name
        },
        aggs : {
            top_keyword : {
                terms : {
                    field : "keyword_count.word.keyword",
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
        var result = common.getResult( "99", "ERROR", "top_keyword");
        res.send(result);
    });
});

var topStatisticsResult;

router.post("/top/statistics", function(req, res){
    console.log("Router for IF_DMA_00102");
    var keyword = [];
    var interval = req.body.interval || "1D";
    var index = common.getIndex(req.body.channel);
    if(req.body.keyword == undefined || req.body.keyword == "" || req.body.keyword == null){
    	var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    	body.aggs = {
    		keyword_count :{	
    			nested : {
    				path : "keyword_count"	 
    			},
    			aggs : {
    				aggs_name : {
    					terms : {
    						field : "keyword_count.word.keyword",
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
    var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());
    
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
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
        									"keyword_count.word.keyword" : keyword 
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
    	var dayList = common.getDays(req.body.start_dt.toString(), req.body.end_dt.toString(), interval);
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
    	topStatisticsResult = common.getResult( "99", "ERROR", "top_statistics_keyword");
    	res.send(topStatisticsResult);
    });
}

router.post("/hot/count", function(req, res){
    console.log("Router for IF_DMA_00103");
    
    var interval = req.body.interval || "1H";
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    let sumsize = parseInt(from)*parseInt(size);
    let resultsize = parseInt(sumsize)-parseInt(size);
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
	var hour_ago = new Date().getHours() - 1 ;
	var now_ago = new Date().getHours() + 1 ;
	now = now.slice(0,10) + "0000";
	hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + "0000";
	now_ago = now.slice(0,8) + ( now_ago < 10 ? "0" + now_ago : now_ago ) + "0000";
	//var body = common.getBodyNoSize(hour_ago, now_ago);
	var body = common.getBodyNoSize(req.body.start_dt.toString(), req.body.end_dt.toString());   // 하드코딩 데이터 확인 쿼리
	
    body.aggs.rt_hot_keyword = {
        date_histogram : {
            field : "startTime",
            interval : interval,
            order : {
                _key : "desc"
            },
            min_doc_count : 1   // TEST
        },
        aggs : {
        	keyword_count : {
                nested : {
                    path : "keyword_count"   
                },
                aggs : {
                    aggs_name : {
                        terms : {
                            field : "keyword_count.word.keyword",
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
    	var result = common.getResult( "10", "OK", "hot_count");
    	if(resp.aggregations.rt_hot_keyword.buckets.length > 0){
    		if ( resp.aggregations.rt_hot_keyword.buckets.length >= 2 ){
                time_result = resp.aggregations.rt_hot_keyword.buckets.slice(0,2);  // 실제로는 전시간, 현재시간으로 2개만 발생
                current_words = time_result[0].keyword_count.aggs_name.buckets;  // 현재 시간
                before_words = time_result[1].keyword_count.aggs_name.buckets;  //  전 시간
            }else{
            	time_result = resp.aggregations.rt_hot_keyword.buckets;  // 실제로는 전시간, 현재시간으로 2개만 발생
            	current_words = time_result[0].keyword_count.aggs_name.buckets;  // 현재 시간
            }
    		
            for( i in current_words){
                for( j in before_words){
                    if( current_words[i].key == before_words[j].key ){
                        current_words[i].updown = Math.ceil( 100 / ( current_words[i].doc_count - before_words[j].doc_count ) );
                    }                
                }
            }

            current_words = current_words.sort( function(a, b){
                return a.updown > b.updown ? -1 : a.updown < b.updown ? 1 : 0;
            });
            result.data.count = current_words.length;
            
            var fornum = 0;
            if(sumsize < current_words.length){
            	fornum = sumsize;
            }else{
            	fornum = current_words.lenght;
            }
            current_words = current_words.slice(resultsize,fornum);
            for(i in current_words){
                for(j in before_words){
                    if(current_words[i].key == before_words[j].key){
                        current_words[i].before_count = before_words[j].doc_count;
                    }
                }
            }
            result.data.result = current_words;
            res.send(result);
    	}else{
    		var result = common.getResult( "20", "NODATA", "hot_count");
    		res.send(result);
    	}
        
    }, function(err){
        console.log(err);
    })
});

/*대역변수 /hot/statistics에서 키워드별로 한건씩 조회하여 값 셋팅
 * 키워드 별로 hotStatistics(키워드, req, res, 종료 여부) 호출 	
 * 키워드 수만큼 hotStatistics호출 후 hotStatisticsResult에 데이터 쌓아 놓음. */ 
var hotStatisticsResult;

router.post("/hot/statistics", function(req, res){
    console.log("Router for IF_DMA_00104");
    hotStatisticsResult = common.getResult("10", "OK", "hot_statistics");
    hotStatisticsResult.data.result = [];
    if(req.body.keyword !== undefined){
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
    						field : "keyword_count.word.keyword",
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
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
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
           									"keyword_count.word.keyword" : keyword 
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
    		if(obj[0] !== undefined){
        		returnVal1 = obj[0];
        	}
    	}
    	if(dateObj[0] == hour_ago){
    		if(obj[0] !== undefined){
        		returnVal2 = obj[0];
        	}
    	}
    	if(dateObj[1] == now){
    		if(obj[1] !== undefined){
        		returnVal1 = obj[0];
        	}
    	}
    	if(dateObj[1] == hour_ago){
    		if(obj[1] !== undefined){
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
    	hotStatisticsResult = common.getResult("99", "ERROR", "hot_statistics");
    	res.send(hotStatisticsResult);
    });
}

router.get("/relation", function(req, res){
    console.log("Router for IF_DMA_00105");
    // 연관키워드는 연구소에서 모듈 제공!?
    res.send("Router for IF_DMA_00105");
});

router.post("/issue", function(req, res){

    console.log("Router for IF_DMA_00106");
    let size = req.body.size || 0;
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "day";
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.keyword !== undefined){
        var nest_obj = {
            nested : {
                path : "keyword_count",
                query : {
                    term : {
                        "keyword_count.word" : req.body.keyword
                    }
                }
            }
        }
        body.query.bool.filter.push(nest_obj);
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
            var obj = {};
            if ( req.body.interval == "day" ){
                obj.key = resp.aggregations.keyword_hist.buckets[i].key_as_string.substr(0, 8);
            } else if ( req.body.interval == "month" ) {
                obj.key = resp.aggregations.keyword_hist.buckets[i].key_as_string.substr(0, 6);
            } else {
                obj.key = resp.aggregations.keyword_hist.buckets[i].key_as_string.substr(0, 10);
            }
            
            obj.count = resp.aggregations.keyword_hist.buckets[i].doc_count;
            obj.word = req.body.keyword;
            result.data.result.push(obj);
        }

        res.send(result);
    }, function(err){
        var result = common.getResult("99", "ERROR", "issue_keyword");
        res.send(result);
    });
});

router.post("/issue/statistics", function(req, res){
    // 데이터 준비 필요
    console.log("Router for IF_DMA_00107");
    var size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.keyword !== undefined){
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
            									"keyword_count.word.keyword" : keyword 
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
    	result.data.count = resp.hits.total;
        result.data.result = [];
        var obj = {
        	division : "negative",
            count : resp.aggregations.negative.doc_count,
            rate : Math.round((resp.aggregations.negative.doc_count/resp.hits.total)*100)
        }
       	result.data.result.push(obj);
        var obj1 = {
           	division : "neutral",
            count : resp.aggregations.neutral.doc_count,
            rate : Math.round((resp.aggregations.neutral.doc_count/resp.hits.total)*100)
        }
        result.data.result.push(obj1);
        var obj2 = {
           	division : "positive",
            count : resp.aggregations.positive.doc_count,
            rate : Math.round((resp.aggregations.positive.doc_count/resp.hits.total)*100)
        }
        result.data.result.push(obj2);
        res.send(result);
    }, function(err){
        var result = common.getResult("99", "ERROR", "issue_keyword");
        res.send(result);
    });
});

module.exports = router;