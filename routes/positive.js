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
    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);

    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});

    var index = common.getIndex(req.body.channel);

    client.search({
        index,
        body
    }).then(function(resp){
        res.send(resp);
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