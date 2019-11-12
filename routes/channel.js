var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');

router.post("/count", function(req, res){

    console.log("Router for IF_DMA_00301");
    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    body.aggs.day = {
      	date_histogram : {
      		field : "startTime",
      		interval : interval,
            min_doc_count : 1
        },
        aggs : {
        	index : {
        		terms : {
        			field : "_index"
        		}
        	}
        }
    };
    
    var index = common.getIndex(req.body.channel);
    
    client.search({
        index,
        body 
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "channel_count");
    	var total = 0;
    	result.data.count = 0;
        result.data.result = [];
        test = Object.entries(resp.aggregations.day.buckets);
        for(i in test){
        	total = total + test[i][1].doc_count;
        	test2 = Object.entries(test[i][1].index.buckets);
        	for(j in test2){
        		var obj = {
                    key : test[i][1].key_as_string,
                    channel : test2[j][1].key,
                    count : test2[j][1].doc_count
                }
                result.data.result.push(obj);
        	}
        }
        result.data.count = resp.hits.total;
        res.send(result);
    }, function(err){
        console.log(err);
    });
});

router.post("/statistics", function(req, res){
    console.log("Router for IF_DMA_00302");
    let size = req.body.size || 10;
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    if( req.body.category1 !== undefined)
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if( req.body.category2 !== undefined)
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    body.aggs.day = {
      	date_histogram : {
      		field : "startTime",
      		interval : interval,
            min_doc_count : 1
        },
        aggs : {
        	index : {
        		terms : {
        			field : "_index"
        		}
        	}
        }
    };
    
    var index = common.getIndex(req.body.channel);
    
    client.search({
        index,
        body 
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "channel_statistics");
    	var total = 0;
    	result.data.count = 0;
        result.data.result = [];
        test = Object.entries(resp.aggregations.day.buckets);
        for(i in test){
        	total = total + test[i][1].doc_count;
        	test2 = Object.entries(test[i][1].index.buckets);
        	var z = 1;
        	for(j in test2){
        		var obj = {
        			no : z,
                    channel : test2[j][1].key,
                    count : test2[j][1].doc_count,
                    rate : Math.round((test2[j][1].doc_count/resp.hits.total)*100)
                }
        		z++;
                result.data.result.push(obj);
        	}
        }
        result.data.count = resp.hits.total;
        res.send(result);
    }, function(err){
        console.log(err);
    });
});


module.exports = router;