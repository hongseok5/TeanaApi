var express = require("express");
var router = express.Router();
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
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 10);
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
                    field : "keyword_count.word.keyword", // field name
                    size : size


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
        result.data.result = resp.aggregations.aggs_top_keyword.top_keyword.buckets;
        result.data.result = result.data.result.sort( function(a, b){
            return a.doc_count > b.doc_count ? -1 : a.doc_count < b.doc_count ? 1 : 0;
        });
        for(i in result.data.result){
            result.data.result[i].no = parseInt(i) + 1;
        }
        res.send(resp);
    }, function(err){
        var result = common.getResult( "99", "ERROR", "top_keyword");
        res.send(result);
    });
});

router.post("/top/statistics", function(req, res){
    console.log("Router for IF_DMA_00102");
    var keyword = [];
    var size = req.body.size || 10;
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
            for(i in test){
            	keyword.push(test[i][1].key);
            }
            topKeyword(keyword, req, res);
        }, function(err){
            console.log(err);
        });
    }else{
    	keyword = req.body.keyword;
    	topKeyword(keyword);
    }
    
    
});

function topKeyword(keyword, req, res){
	var size = req.body.size || 10;
    var interval = req.body.interval || "1D";
    var index = common.getIndex(req.body.channel);
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
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
    body.aggs = {
    	division :{	
    		date_histogram : {
    			field : "startTime",
    			interval : interval,
    			min_doc_count : "1"
    		},
    		aggs : {
    			keyword_count : {
    				nested : {
    					path : "keyword_count"
    				},
    				aggs : {
    					aggs_name : {
    						terms : {
    							field : "keyword_count.word.keyword"
    						} 
    					}
    				}
    			},
    			"startTime" : {
    				nested : {
    					path : "startTime"
    				},
    				aggs : {
    					aggs_name : {
    						terms : {
    							field : "startTime.keyword"
    						}
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
        test = Object.entries(resp.aggregations.division.buckets);
        var keylen = keyword.length;
        var keySet = new Array();
        for(var z=0; z<keylen; z++){
        	keySet[z] = keyword.pop();
        }
        for(i in test){
        	test2 = Object.entries(test[i][1].keyword_count.aggs_name.buckets);
        	for(j in test2){
        		for(var x=0; x<keySet.length; x++){
        			if(test2[j][1].key == keySet[x]){
        				var obj = {
        					key : test[i][1].key_as_string,	
        		        	word : test2[j][1].key,
        		            count : test2[j][1].doc_count
        	        	}
        	        	result.data.result.push(obj);
        			}
        		}
        	}
	    }
        res.send(result);
    }, function(err){
        console.log(err);
    });
}

router.post("/hot/count", function(req, res){
    console.log("Router for IF_DMA_00103");
    
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    var hour_ago = new Date().getHours() - 2 ;
    var interval = req.body.interval || "1H";

    now = now.slice(0,10) + "0000";
    hour_ago = now.slice(0,8) + ( hour_ago < 10 ? "0" + hour_ago : hour_ago ) + "0000";

    // var body = common.getBody("20110114090910", "20191030093959", 0);   // 하드코딩
    var body = common.getBody(req.body.start_dt, req.body.end_dt, 0);   // 하드코딩
    body.aggs.rt_hot_keyword = {
        date_histogram : {
            field : "start_time",
            interval : interval,
            order : {
                _key : "desc"
            },
            min_doc_count : 1   // TEST
        },
        aggs : {
            neut_keyword : {
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
            }
        }
    }
    
    // client.msearch()
    var index = "call_test3";
    //common.getIndex(req.body.channel);
    client.search({
        index,
        body
    }).then(function(resp){

        if ( resp.aggregations.rt_hot_keyword.buckets.length > 2 ){
            time_result = resp.aggregations.rt_hot_keyword.buckets.slice(0,2);  // 실제로는 전시간, 현재시간으로 2개만 발생
        }
        
        current_words = time_result[0].neut_keyword.aggs_name.buckets;  // 현재 시간
        before_words = time_result[1].neut_keyword.aggs_name.buckets;  //  전 시간
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

        current_words = current_words.slice(0,10);
        for(i in current_words){
            for(j in before_words){
                if(current_words[i].key == before_words[j].key){
                    current_words[i].before_count = before_words[j].doc_count;
                }
            }
        }

        res.send(current_words);
    }, function(err){
        console.log(err);
    })
});

router.get("/hot/statistics", function(req, res){
    console.log("Router for IF_DMA_00104");
    // 급상승 키워드는 API 하나로 가능!?
    res.send("Router for IF_DMA_00104");
});

router.get("/relation", function(req, res){
    console.log("Router for IF_DMA_00105");
    // 연관키워드는 연구소에서 모듈 제공!?
    res.send("Router for IF_DMA_00105");
});

router.post("/issue", function(req, res){

    console.log("Router for IF_DMA_00106");
    let size = req.body.size || 0;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
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