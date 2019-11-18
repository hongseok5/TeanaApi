
var dateFormat = require('dateformat');
var now = dateFormat(new Date(), "yyyymmddHHMMss");
var hour_ago = new Date().getHours() - 1 ;
var flatten = require('flat');
const rp = require('request-promise');
const request = require('request');
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ 
  host : '10.253.42.185:9200',
  log: 'trace',
  apiVersion: '6.8' // insert 수행시 필요한 설정
});
var option = {
    uri : 'http://10.253.42.185:12800/txt_to_kwd',
    method : "POST",
    body : {
        mode : "kma",
        t_vec : "mobile_test",
        text : null
    },
    json : true
}
data_set = [];
data_obj = {

};

client.search({
    index : "stt_201911",
    body : {
        size : 1
    }
}).then(function(resp){
    console.log("test: " + resp.hits.hits)
    for( i in resp.hits.hits){

        option.body.text =  resp.hits.hits[i]._source.source.timeNtalk;

        rp(option).then(function(data){
            var document = {
                index : "ssg_stt_test",
                type : "doc",
                id : resp.hits.hits[i]._source.source.startTime + resp.hits.hits[i]._source.source.extension,
                body : {
                    timeNtalk : resp.hits.hits[i]._source.source.timeNtalk,
                    startTime : resp.hits.hits[i]._source.source.startTime,
                    extension : resp.hits.hits[i]._source.source.extension,
                    keyword_count : data.output
                }
            };
            client.index(document).then(function(resp){
                console.log("success");
            }, function(err){
                console.log(err);
            })
        })
        
        
    }
}), function(err){
    console.log(err);
};


