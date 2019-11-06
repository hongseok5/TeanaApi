var express = require('express');
var router =  express.Router();
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host : '10.253.42.185:9200',
    log: 'trace'
});
var common = require('./common');

router.post('/search', function(req, res, next){

    var index = req.body.index || 'ua_call*';
    let srchCallStartDtm = req.body.srchCallStartDtm || null;
    let srchCallEndDtm = req.body.srchCallEndDtm || null;
    let srchAiMinScore = req.body.srchAiMinScore || null;
    let srchAiMaxScore = req.body.srchAiMaxScore || null;
    let srchHumMinScore = req.body.srchHumMinScore || null;
    let srchHumMaxScore = req.body.srchHumMaxScore || null;
    // filter.term
    let srchAiYn = req.body.srchAiYn || null;
    let srchHumYn = req.body.srchHumYn || null;
    let srchDeptId = req.body.srchDeptId || null;
    let srchExtension = req.body.srchExtension|| null;
    // must.match
    let srchEmpNm = req.body.srchEmpNm || null;
    let srchQaEmpId = req.body.srchQaEmpId || null;
    let srchKeyword = req.body.srchKeyword || null;

    if( srchKeyword != null ){
        srchKeyword = srchKeyword.replace(/(^\s*)|(\s*$)/g, '');
    }
    if( srchEmpNm != null){
        srchEmpNm = srchEmpNm.replace(/(^\s*)|(\s*$)/g, '');
    }
    let size = req.body.size || 20;
    let from = ( req.body.from -1 ) * size || 0;

    var body = {
        query : {
            bool : {
                filter : [],
                must : []
            }
        },
        sort : {
            "start_time" : "asc" // 파라미터로 받아서 정렬하기 
        },
        from : from,
        size : size
    };
    if(srchAiMaxScore != null || srchAiMinScore != null){
        let range_ai_score = {};
        if(srchAiMaxScore != null)
            range_ai_score.lte = srchAiMaxScore
        if(srchAiMinScore != null)
            range_ai_score.gte = srchAiMinScore
        body.query.bool.filter.push({range : {ai_score : range_ai_score}});
    }
    if(srchHumMaxScore != null || srchHumMinScore != null){
        let range_hum_score = {};
        if(srchHumMaxScore != null)
            range_hum_score.lte = srchHumMaxScore
        if(srchHumMinScore != null)
            range_hum_score.gte = srchHumMinScore
        body.query.bool.filter.push({range : {hum_score : range_hum_score}});
    }
    if(srchCallStartDtm != null || srchCallEndDtm != null){
        let range_start_time = {};
        if(srchCallEndDtm != null)
            range_start_time.lte = srchCallEndDtm
        if(srchCallStartDtm != null)
            range_start_time.gte = srchCallStartDtm
        body.query.bool.filter.push({range : {start_time : range_start_time}});
    }
    if(srchExtension != null)
        body.query.bool.filter.push({term: {extension : srchExtension }});
    if(srchHumYn != null && srchHumYn != "ALL")
        body.query.bool.filter.push({term: {hum_yn : srchHumYn}});
    if(srchDeptId != null)
        body.query.bool.filter.push({term: {dept_id : srchDeptId}});
    if(srchAiYn != null && srchAiYn != "ALL")
        body.query.bool.filter.push({term: {ai_yn : srchAiYn}});
    if(srchEmpNm != null)
        body.query.bool.must.push({match : {emp_nm : srchEmpNm}});
    if(srchQaEmpId != null)
        body.query.bool.must.push({match : {qa_emp_id : srchQaEmpId}});
    if(srchKeyword != null)
        body.query.bool.must.push({match : { talk_content: srchKeyword}});

    client.search({
        index: index,
        body: body
    }).then(function(resp) {
        resp.response_code = res.statusCode;
        res.send(resp);
        if (body.from === null || body.from === 0) {
            querylog.write(index, q, resp.hits.total, resp.took);
        }
    }, function(err) {

        res.status(err.statusCode).send(err.response);
        //logger.error('elasticsearch error | ' + err.toString());
    });

})

module.exports = router;
