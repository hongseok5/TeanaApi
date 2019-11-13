var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00601");
    let age = parseInt( req.body.age ); // 전체일 경우 어떤 값으로 오는지 확인?
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    var index = common.getIndex(req.body.channel);

    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    if(req.body.gender !== undefined)
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(req.body.age !== undefined)
        body.query.bool.filter.push({ range : { age : { gte : age - 9, lte : age }}});
    body.aggs.aggs_age = {
        histogram : {
            field : "age",
            interval : 10
        },
        aggs : {
            aggs_gender : {
                terms : {
                    field : "gender"
                }
            }
        }
    }
    

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult("10", "OK", "statistics_by_customer");
        result.data.count = resp.hits.total;
        result.data.result = [];
        console.log(resp.aggregations);
        for(i in resp.aggregations.aggs_age.buckets){
            for( j in resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets){
                var obj = {};
                obj.division = resp.aggregations.aggs_age.buckets[i].key;
                obj.gender = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].key;
                obj.count = resp.aggregations.aggs_age.buckets[i].aggs_gender.buckets[j].doc_count;
                result.data.result.push(obj);
            }
        }
        res.send(result);
    }, function(err){
        var result = common.getResult("99", "ERROR", "statistics_by_customer");
        res.send(result);
    });
});


module.exports = router;