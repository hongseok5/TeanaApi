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
	var source = [	  "extension"
					, "caseNumber"
					, "endTime"
					, "duration"
					, "company"
					, "companyNm"
					, "productCode"
					, "productNm"
					, "Mcate"
					, "McateNm"
					, "mdId"
					, "mdNm"
					, "startTime"
					, "extension"
					, "ifId"
					, "content"
					, "reContent"
					, "category2Nm"
					, "category1Nm"
					, "category2"
					, "category1"
					, "agentId"
					, "agentNm"
					, "analysisCateNm"
					, "inCateNm"
					, "reasonCate1Nm"
					, "reasonCate2Nm"
					, "customerNumber"
					, "gender"
					, "age"
					, "direction"
					, "dept_nm"
					, "pre_dept_nm"
					, "det_nm"
					, "attr_val01"
					, "caller_num"
					, "local_ext"
					, "reasonDescription"
				];
    var body = common.getBody(req.body.start_dt, req.body.end_dt, size, from, source);
    var index = common.getIndex(req.body.channel);
	// 정렬 파라미터가 start_time:desc,company_name:asc 형태로 들어옴
	var sort = null;
	if( !common.getEmpty(req.body.sort)){
		sort =  [{ "startTime" : "desc" }];
	} else {
		sort = req.body.sort;
	}
	let sort_arr = [];
	if(typeof sort === "string" ){
		//검색어가 있을 경우
		if(req.body.skeyword != null && req.body.skeyword != ""){
			sort_arr.push("_score");
			sort = sort.split(",");
			for( i in sort ){
				let k = sort[i].substr(0, sort[i].indexOf(":"));
                let obj = {}
                obj[k] = sort[i].substr( sort[i].indexOf(":")+1 , sort[i].length );
                sort_arr.push(obj);
			}			
		} else {
			sort = sort.split(",")
			for( i in sort ){
                let k = sort[i].substr(0, sort[i].indexOf(":"));
                let obj = {}
                obj[k] = sort[i].substr( sort[i].indexOf(":")+1 , sort[i].length );
                sort_arr.push(obj);
            }
            sort_arr.push("_score");    
		}
	} else {
		sort_arr = sort;
	}
	body.sort = sort_arr;

	if(common.getEmpty(req.body.category) && req.body.category != "ALL")
        body.query.bool.filter.push({ term : { analysisCate : req.body.category }});
    if(common.getEmpty(req.body.companyCode))
        body.query.bool.filter.push({ term : { company : req.body.companyCode }});
    if(common.getEmpty(req.body.productCode))
        body.query.bool.filter.push({ term : { productCode : req.body.productCode }});
    if(common.getEmpty(req.body.mdCate) && req.body.mdCate != "ALL")
        body.query.bool.filter.push({ term : { Mcate : req.body.mdCate }});
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
	if(common.getEmpty(req.body.category1))
        body.query.bool.filter.push({ term : { category1 : req.body.category1 }});
    if(common.getEmpty(req.body.category2))
        body.query.bool.filter.push({ term : { category2 : req.body.category2 }});
    if(common.getEmpty(req.body.reasonCate1Nm))
        body.query.bool.filter.push({ term : { reasonCate1Nm : req.body.reasonCate1Nm }});
    if(common.getEmpty(req.body.reasonCate2Nm))
        body.query.bool.filter.push({ term : { reasonCate2Nm : req.body.reasonCate2Nm }});	
    if(common.getEmpty(req.body.gender) && req.body.gender != "ALL")
        body.query.bool.filter.push({ term : { gender : req.body.gender }});
    if(common.getEmpty(req.body.age) && req.body.age != "ALL")
    	body.query.bool.filter.push({ range : { age : { gte : Number(req.body.age), lte : Number(req.body.age) + 9}}});

        
	if(common.getEmpty(req.body.skeyword)) {
		var query_stting = {
			simple_query_string : {
				query: req.body.skeyword,   // 검색어
				fields: ["timeNtalk", "content", "reContent"]  // 검색어가 있는지 확인하는 복수개의 필드
			}
		};
		body.query.bool.should = query_stting;
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
				customerNumber : common.convertEmpty(test[i][1]._source.customerNumber),
				gender : common.convertGender(test[i][1]._source.gender),
				age : common.convertEmpty(test[i][1]._source.age),
				direction : common.convertEmpty(common.convertDirection(test[i][1]._source.direction)),
				dept_nm : common.convertEmpty(test[i][1]._source.dept_nm),
				pre_dept_nm : common.convertEmpty(test[i][1]._source.pre_dept_nm),
				reasonDescription : common.convertEmpty(test[i][1]._source.reasonDescription)
			}
			if( test[i][1]._index == "chat" ){
				try{
					let chat_data = JSON.parse(test[i][1]._source.content)
					if(Array.isArray(chat_data)){
						obj.content = chat_data;
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
		logger.error("voc_search", err);
        var result = common.getResult( "99", "ERROR", "voc_search");
        res.send(result);
    });
});

module.exports = router;