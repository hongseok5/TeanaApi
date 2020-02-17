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
winston.loggers.add("voc", winstonConfig.createLoggerConfig("voc"));
var logger = winston.loggers.get("voc");

router.post("/search", function(req, res){
    logger.info("Router for IF_DMA_00701");
    if(!common.getEmpty(req.body.start_dt)){
    	var result = common.getResult("40", "OK", "There is no required start_dt");
    	res.send(result);
    	return;
    }
    if(!common.getEmpty(req.body.end_dt)){
    	var result = common.getResult("40", "OK", "There is no required end_dt");
    	res.send(result);
    	return;
    }
    let size = req.body.size || 10;
    let from = req.body.from || 1;
    var source = ["extension","caseNumber","endTime","duration","company","companyNm","productCode","productNm","Mcate","McateNm","mdId","mdNm","startTime","extension","ifId", "content", "reContent", "category2Nm", "category1Nm", "agentId", "agentNm", "analysisCateNm", "inCateNm", "reasonCate1Nm", "reasonCate2Nm", "customerNumber"];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, source);
    var index = common.getIndex(req.body.channel);
    if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.productCode))
        body.query.bool.filter.push({ term : { productCode : req.body.productCode }});
    if(common.getEmpty(req.body.mCate) && req.body.mCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mCate }});
    if(common.getEmpty(req.body.inCate) && req.body.inCate != "ALL")
        body.query.bool.filter.push({ term : { inCate : req.body.inCate }});
    if(common.getEmpty(req.body.mdNm))
        body.query.bool.filter.push({ term : { mdNm : req.body.mdNm }});
    if(common.getEmpty(req.body.keyword) && req.body.keyword != "ALL") {
		 var nest_obj = {
            nested : {
                path : "keyword_count",
                query : {
                    term : {
                        "keyword_count.keyword" : req.body.keyword
                    }
                }
            }
        }
        body.query.bool.filter.push(nest_obj);
	}
    if(req.body.orderYn == "Y" )
        body.query.bool.filter.push({ term : { category2 : "zz" }});
    if(common.getEmpty(req.body.category1Nm))
        body.query.bool.filter.push({ term : { category1Nm : req.body.category1Nm }});
    if(common.getEmpty(req.body.category2Nm))
        body.query.bool.filter.push({ term : { category2Nm : req.body.category2Nm }});
    if(common.getEmpty(req.body.reasonCate1Nm))
        body.query.bool.filter.push({ term : { reasonCate1Nm : req.body.reasonCate1Nm }});
    if(common.getEmpty(req.body.reasonCate2Nm))
        body.query.bool.filter.push({ term : { reasonCate2Nm : req.body.reasonCate2Nm }});	

        
	if(common.getEmpty(req.body.skeyword)) {
		var query_stting = {
			simple_query_string : {
				query: req.body.skeyword,   // 검색어
				fields: ["timeNtalk", "content", "reContent"]  // 검색어가 있는지 확인하는 복수개의 필드
			}
		};
		body.query.bool.filter.push(query_stting);
	}
	
	body.sort = {
        "startTime" : "desc" // 파라미터로 받아서 정렬하기 
    }
        
    client.search({
        index ,
        body 
    }).then(function(resp){
    	var result = common.getResult( "10", "OK", "voc_search");
    	result.data.count = resp.hits.total;
        result.data.result = [];
        test = Object.entries(resp.hits.hits);
        for(i in test){
        	var obj = {
        		extension : test[i][1]._source.extension,
        		casenumber : common.convertEmpty(test[i][1]._source.caseNumber),
        		callDt : common.convertDate(test[i][1]._source.startTime.slice(0,8)),
        		startDtm : common.convertDtm(test[i][1]._source.startTime),
        		endDtm : common.convertDtm(test[i][1]._source.endTime),
        		duration : common.convertDuration(test[i][1]._source.duration),
        		company : common.convertEmpty(test[i][1]._source.company),
        		companyNm : common.convertEmpty(test[i][1]._source.companyNm),
        		productCode : common.convertEmpty(test[i][1]._source.productCode),
        		productNm : common.convertEmpty(test[i][1]._source.productNm),
        		category1Nm : common.convertEmpty(test[i][1]._source.category1Nm),
        		category2Nm : common.convertEmpty(test[i][1]._source.category2Nm),
        		Mcate : test[i][1]._source.Mcate,
        		McateNm : test[i][1]._source.McateNm,
        		mdId : test[i][1]._source.mdId,
        		mdNm : test[i][1]._source.mdNm,
        		startTime : test[i][1]._source.startTime,
				extension : test[i][1]._source.extension,
        		channel : common.getIndexCode(test[i][1]._index),
        		ifId : test[i][1]._source.ifId,
				//content : test[i][1]._source.content,
				//reContent : test[i][1]._source.reContent,
				agentId : common.convertEmpty(test[i][1]._source.agentId),
				agentNm : common.convertEmpty(test[i][1]._source.agentNm),
				analysisCateNm : common.convertEmpty(test[i][1]._source.analysisCateNm),
				inCateNm : common.convertEmpty(test[i][1]._source.inCateNm),
				channelNm : common.getIndexNm(common.getIndexCode(test[i][1]._index)),
				reasonCate1Nm : common.convertEmpty(test[i][1]._source.reasonCate1Nm),
				reasonCate2Nm : common.convertEmpty(test[i][1]._source.reasonCate2Nm),
				customerNumber : common.convertEmpty(test[i][1]._source.customerNumber)
			}
			if( test[i][1]._index == "chat" ){
				try{
					let chat_data = JSON.parse(test[i][1]._source.content)
					if(Array.isArray(chat_data.content)){
						obj.content = chat_data.content;
					} else {
						obj.content = [];
					}
				} catch(err){
					obj.content = [];
				}
			} else {
				obj.content = test[i][1]._source.content
				obj.reContent = test[i][1]._source.reContent
			}
        	result.data.result.push(obj);
        }
        res.send(result);
    }, function(err){
		logger.error("channel_statistics ", err);
        var result = common.getResult( "99", "ERROR", "channel_statistics");
        res.send(result);
    });
});

module.exports = router;