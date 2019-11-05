var express = require("express");
var router = express.Router();
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host : '10.253.42.185:9200',
    log: 'trace'
});
var common = require('./common');

router.post("/count", function(req, res){

    console.log("Router for IF_DMA_00301");
    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    let interval;
    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});

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

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00302");

    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    
    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});

    client.search({
        index ,
        body 
    }).then(function(resp){
        result = [];
        res.send(resp);
    }, function(err){
        console.log(err);
    });
});


module.exports = router;