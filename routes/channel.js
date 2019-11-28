var express = require("express");
var router = express.Router();
var client = require('../index');
var common = require('./common');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');

/************************************************************
 * 로그 설정.
 ************************************************************/
winston.loggers.add("channel", winstonConfig.createLoggerConfig("channel"));
var logger = winston.loggers.get("channel");

router.post("/count", function(req, res){

    logger.info("Router for IF_DMA_00301");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    var dayList = common.getDays(req.body.start_dt, req.body.end_dt, interval);
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
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
        var indexb = index.split(",");
        for(z in indexb){
        	var obj2 = new Array();
        	for(k in dayList){
        		var channelindex = "";
        		if(indexb[z] == "call_*"){
        			channelindex = "call";
        		}else{
        			channelindex = indexb[z];
        		}
        		var obj = {
            			key : dayList[k].key,
            	        channel : channelindex,
            	        count : 0
            		}
        			obj2[k] = obj;
            }
    		result.data.result.push(obj2);
        }
        
        for(p in result.data.result){
        	for(i in test){
            	total = total + test[i][1].doc_count;
            	test2 = Object.entries(test[i][1].index.buckets);
            	for(j in test2){
            		var channelcheck = result.data.result[p];
            		for(l in channelcheck){
            			if(channelcheck[l].key == test[i][1].key_as_string && channelcheck[l].channel == test2[j][1].key){
            				result.data.result[p][l].count = test2[j][1].doc_count;
                		}else if(channelcheck[l].key == test[i][1].key_as_string && "call" == test2[j][1].key.substring(0,4)){
                			result.data.result[p][l].count = parseInt(result.data.result[p][l].count)+parseInt(test2[j][1].doc_count);
                		}
            		}
          		}
          	}
        }
        
        result.data.count = resp.hits.total;
        res.send(result);
    }, function(err){
		logger.error("channel_count ", err);
        var result = common.getResult("99", "ERROR", "channel_count");
        res.send(result);
    });
});

router.post("/statistics", function(req, res){
    logger.info("Router for IF_DMA_00302");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    }
    var body = common.getBodyNoSize(req.body.start_dt, req.body.end_dt);
    var index = common.getIndex(req.body.channel);
    var interval = req.body.interval || "1D";
    if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    body.aggs.channel = {
		terms : {
			field : "_index"
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
        result.data.count = resp.aggregations.channel.buckets.length;
        var z = 0;
        var call = 0;
        for(i in resp.aggregations.channel.buckets){
        	z = parseInt(z)+parseInt(resp.aggregations.channel.buckets[i].doc_count);
        }
		for(j in resp.aggregations.channel.buckets){
        	var total = Math.ceil(parseInt(resp.aggregations.channel.buckets[j].doc_count)/parseInt(z)*100);
        	if(resp.aggregations.channel.buckets[j].key.substring(0,4) == "call"){
        		call = parseInt(call) + parseInt(resp.aggregations.channel.buckets[j].doc_count);
        	}else{
        		var obj = {
            	   	channel : resp.aggregations.channel.buckets[j].key,
            	   	count : resp.aggregations.channel.buckets[j].doc_count,
            	   	rate : total,
            	}
        		result.data.result.push(obj);
        	}
        }
		var objcall = {
				channel : "call",
        	   	count : call,
        	   	rate : Math.ceil(parseInt(call)/parseInt(z)*100),	
		}
		result.data.result.push(objcall);
		
        res.send(result);
    }, function(err){
		logger.error("statistics_by_class ", err);
        var result = common.getResult("99", "ERROR", "statistics_by_class");
        res.send(result);
    });
});


module.exports = router;