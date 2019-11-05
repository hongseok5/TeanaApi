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
    //let interval = req.body.interval || undefined;  
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

    let size = req.body.size || 10 ;
    let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(channel);

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