var dateformat = require('dateformat');
const fs = require('fs');
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ 
  host : '10.253.42.122:9200',
  log: 'error',
  apiVersion: '6.8'
});

client.ping({
  requestTimeout : 100
}, function(err){
  if (err){
    console.log('elasticsearch connection down!');
  } else {
  console.log('elasticsearch connection well');
  }
});

var resultAt = dateformat(new Date(), "yyyymmddHHMMss");
var write_path = "C:\\Users\\hongseok5\\Downloads\\test_collection"
var ws = fs.WriteStream(write_path + resultAt + ".json"); 

/**
 * 상담지원시스템 > 상담분석 > 원문검색 화면에서
 * 자동카테고리 분류가 잘못된 데이터를 맞는 카테고리로 정정하여
 * 학습데이터로 사용할 JBT 파일을 만드는 소스
 */

// caseNumber와 정정한 자동카테고리 코드를 키,값쌍으로 넣는다.
const cmap = new Map([ 
  ["00723861", "0000000014"],	
  ["00723857", "0000000014"],
  ["00723851", "0000000014"]
]); 


var seq_start = 2100; // 키 값이 겹치지 않도록 현재 콜렉션에서 사용중인 데이터의 개수 +1 값을 사용

// 쿼리
var body = {
  size : 1000,
  _source : [  "timeNtalk", // 필수 - 실제 콜렉션에서 사용할 때는 키 명을 config.yml과 맞도록 주의한다.
              "caseNumber", //필수
              "ifId" ],
  query : {
    terms : {
      caseNumber : Array.from(cmap.keys())
    }
  }
}

// 조회
client.search({ index : "call_*", body }).then((resp) => {
  if( !resp.error && resp.hits.hits.length > 0){

    for(i in resp.hits.hits){
      // map에서 정정할 카테고리 값을 가져온다
      resp.hits.hits[i]._source.category = cmap.get(resp.hits.hits[i]._source.caseNumber);
      // JBT 키를 생성한다
      resp.hits.hits[i]._source.jbt_key = resp.hits.hits[i]._source.category + "_" + ( parseInt(i) + seq_start );
      // 파일을 쓴다
      resp.hits.hits[i]._source.talk = resp.hits.hits[i]._source.timeNtalk;
      resp.hits.hits[i]._source.doc_id = resp.hits.hits[i]._source.ifId;
      delete resp.hits.hits[i]._source.timeNtalk;
      ws.write(JSON.stringify(resp.hits.hits[i]._source) + "\n")
    }

  } else {
    console.log("no query result")
  }
  //ws.end();
}).catch(err => {console.log(err)});
/*



*/