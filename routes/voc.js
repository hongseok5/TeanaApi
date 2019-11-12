var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');

router.post("/search", function(req, res){
    console.log("Router for IF_DMA_70001");

    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, req.body.size);
    var index = common.getIndex(req.body.channel);
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.companyCode !== undefined)
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(req.body.productCode !== undefined)
        body.query.bool.filter.push({ term : { product : req.body.productCode }});
    if(req.body.Mcate !== undefined)
        body.query.bool.filter.push({ term : { Mcate : req.body.Mcate }});
    if(req.body.inCate !== undefined)
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(req.body.MD !== undefined)
        body.query.bool.filter.push({ term : { mdNm : req.body.MD }});
    if(req.body.keyword !== undefined)
        body.query.bool.filter.push({ term : { keyword : req.body.keyword }});

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