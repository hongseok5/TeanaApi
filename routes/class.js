var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');

router.post("/count", function(req, res){
    console.log("Router for IF_DMA_00201");

    let size = req.body.size || 0;  // 통계쿼리는 버킷만
    let from = req.body.from || 1;
    let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);

    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.age !== undefined)
        body.query.bool.filter.push({ term : { age : req.body.age }});    
    if(req.body.gender !== undefined)
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(req.body.companyCode !== undefined)
        body.query.bool.filter.push({ term : { companyCode : req.body.companyCode }});
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

    body.query.bool.must = [
        { bool : { should } }
    ]

    body.aggs.cate1_terms = {
        terms : {
            field : "category1Nm",
            size : 10
        }
    }
    var index = common.getIndex(req.body.channel);

    client.search({
        index,
        body
    }).then(function(resp){
        var result = common.getResult("10", "OK", "count_by_class");
        result.data.count = resp.aggregations.cate1_terms.buckets.length;
        result.data.result = resp.aggregations.cate1_terms.buckets;
        result.data.result = result.data.result.sort( function(a, b){
            return a.doc_count > b.doc_count ? -1 : a.doc_count < b.doc_count ? 1 : 0;
        });
        for(i in result.data.result){
            result.data.result[i].no = parseInt(i) + 1;
        }
        res.send(result);
    }, function(err){
        var result = common.getResult("99", "ERROR", "count_by_class");
        res.send(result);
    });
    
});

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00202");
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    let should = [];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from);
    let interval = req.body.interval || "week";
    if(req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }})
    if(req.body.age !== undefined)
        body.query.bool.filter.push({ term : { age : req.body.age }});    
    if(req.body.gender !== undefined)
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(req.body.companyCode !== undefined)
        body.query.bool.filter.push({ term : { companyCode : req.body.companyCode }});
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

    body.aggs.start_hist = {
        date_histogram : {
            field : "startTime",
            interval : interval,
            min_doc_count : 1, // 개발테스트
            order : {
                _key : "desc"
            }
        },
        aggs : {    //avgTime 필요여부확인 category2 필요여부확인
            aggs_class : {
                terms : {
                    field : "category1Nm"
                }
            }
        }        
    }

var index = common.getIndex(req.body.channel);
    client.search({
        index,
        body 
    }).then(function(resp){

        var result = common.getResult("10", "OK", "statistics_by_class");
        result.data.result = resp.aggregations.start_hist.buckets.slice(0,2);
        result.data.count = result.data.result.length;
        current_words = result.data.result[0].aggs_class.buckets;
        before_words = result.data.result[1].aggs_class.buckets;

        for( i in current_words){
            for( j in before_words){
                if( current_words[i].key == before_words[j].key ){
                    current_words[i].rate = common.getUpdownRate( before_words[j].doc_count, current_words[i].doc_count );
                }
            }
        }
        current_words = current_words.sort( function(a, b){
            return a.rate > b.rate ? -1 : a.rate < b.rate ? 1 : 0;
        });
        current_words = current_words.slice(0,10);

        for( i in current_words){
            for(j in before_words){
                if(current_words[i].key == before_words[j].key){
                    current_words[i].before_count = before_words[j].doc_count;
                }
            }
        }
        result.data.result = current_words;

        for(i in result.data.result){
            result.data.result[i].no = parseInt(i) + 1;
        }
        res.send(result);

    }, function(err){
        var result = common.getResult("99", "ERROR", "statistics_by_class");
        res.send(result);
    });
});

module.exports = router;