var express = require("express");
const elasticsearch = require('elasticsearch');
const dateFormat = require('dateformat');
var router = express.Router();
var client = new elasticsearch.Client({
    host : '10.253.42.185:9200',
    log: 'trace'
});
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
    var size = req.body.size || 0;
    var keyword = req.body.keyword;
    var interval = req.body.interval || "week";
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);

    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    for( i in keyword ){
        body.query.bool
    }
    body.aggs.top_keyword_hist = {

    }

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult( "10", "OK", "top_keyword");
        result.data.count = resp.aggregations.aggs_top_keyword.top_keyword.buckets.length;
        result.data.result = resp.aggregations.aggs_top_keyword.top_keyword.buckets;
        result = [];
        res.send(resp);
    }, function(err){
        console.log(err);
    });
});

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
    // 데이터 준비 필요
    console.log("Router for IF_DMA_00106");
    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    var interval;
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.keyword !== undefined)
        body.query.bool.filter.push({ term : { keyword : req.body.keyword }});

    client.search({
        index,
        body
    }).then(function(resp){
        result = [];
        res.send(resp);
    }, function(err){
        console.log(err);
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
    if(req.body.keyword !== undefined)
        body.query.bool.filter.push({ term : { keyword : req.body.keyword }});

    client.search({
        index,
        body
    }).then(function(resp){
        res.send(resp);
    }, function(err){
        console.log(err);
    });
});

module.exports = router;