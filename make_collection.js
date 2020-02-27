var dateformat = require('dateformat');
const fs = require('fs');
const common = require('./routes/common');
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ 
  host : '10.253.42.122:9200',
  log: 'error',
  apiVersion: '6.8'
});

var resultAt = dateformat(new Date(), "yyyymmddHHMMss");
var write_path = "C:\\Users\\hongseok5\\Downloads\\test_collection"
var ws = fs.WriteStream(write_path + resultAt + ".json"); 
const cmap = new Map([ 

  ["00811348", "0000000008"]

]); 

let coll_body = {
  aggs : {
    max_key : {
      max : {
        field : "no"
      }
    }
  },
  size : 0
}

var body = {
  size : 1000,
  _source : [  "timeNtalk", // 필수 - 실제 콜렉션에서 사용할 때는 키 명을 config.yml과 맞도록 주의한다.
              "caseNumber", //필수
              "timeNtalk",
              "ifId" ],
  query : {
    terms : {
      caseNumber : Array.from(cmap.keys())
    }
  }
}

client.ping({
  requestTimeout : 100
}, function(err){
  if (err){
    console.log('elasticsearch connection down!');
  } else {
  console.log('elasticsearch connection well');
  Promise.all([client.search({ index : "category_collection", body : coll_body}),
               client.search({ index : "call_*", body : body})])
  .then(values => {

    // 기존의 컬렉션 인덱스에서 max 키 값을 가져온다.
    let no = Number(values[0].aggregations.max_key.value) + 1;

    if( !values[1].error && values[1].hits.hits.length > 0){

      for(i in values[1].hits.hits){
        // map에서 정정할 카테고리 값을 가져온다
        values[1].hits.hits[i]._source.category = cmap.get(values[1].hits.hits[i]._source.caseNumber);
        // JBT 키를 생성한다
        values[1].hits.hits[i]._source.no =  parseInt(i) + no;
        values[1].hits.hits[i]._source.jbt_key = values[1].hits.hits[i]._source.category + "_" + ( parseInt(i) + no );
        // 파일을 쓴다
        values[1].hits.hits[i]._source.talk = values[1].hits.hits[i]._source.timeNtalk;
        values[1].hits.hits[i]._source.doc_id = values[1].hits.hits[i]._source.ifId;
        delete values[1].hits.hits[i]._source.timeNtalk;
        ws.write(JSON.stringify(values[1].hits.hits[i]._source) + "\n")
        let document ={
          index : "category_collection",
          type : "doc",
          id : values[1].hits.hits[i]._source.jbt_key,
          body : {
            doc : {
              jbt_key : values[1].hits.hits[i]._source.jbt_key, // 컬렉션 키
              use_yn : "Y", // 사용여부
              doc_id : values[1].hits.hits[i]._source.ifId, // 상담식별자
              no : parseInt(i) + no,  // 시퀀스 번호
              //len : resp.hits.hits[i]._source.timeNtalk.length,
              talk : values[1].hits.hits[i]._source.talk, // 상담 텍스트
              category_code : values[1].hits.hits[i]._source.category,  //카테고리 코드
              category : common.getCategory(parseInt(values[1].hits.hits[i]._source.category)) //카테고리 번호
           } ,
           doc_as_upsert : true
          }
        };
        client.update(document).then(resp => {
          console.log(JSON.stringify(resp))
        });
      }
  
    } else {
      console.log("no query result")
    }

  }).catch(err => {console.log(err)})
  }
});



/**
 * 상담지원시스템 > 상담분석 > 원문검색 화면에서
 * 자동카테고리 분류가 잘못된 데이터를 맞는 카테고리로 정정하여
 * 학습데이터로 사용할 JBT 파일을 만드는 소스
 */

// caseNumber와 정정한 자동카테고리 코드를 키,값쌍으로 넣는다.



//var no = null // 키 값이 겹치지 않도록 현재 콜렉션에서 사용중인 데이터의 개수 +1 값을 사용

function getMaxKey(){
  return new Promise((resolve,reject) => {

    client.search({ index: "category_collection", body : coll_body}).then(resp => {  
      if(!resp.err){
        resolve(parseInt(resp.aggregations.max_key.value));
      } else {
        reject(resp);
      }
    }).catch(err => {console.log(err)});
    
  });
} 


// 조회
/*
client.search({ index : "call_*", body }).then((resp) => {
  if( !resp.error && resp.hits.hits.length > 0){

    for(i in resp.hits.hits){
      // map에서 정정할 카테고리 값을 가져온다
      resp.hits.hits[i]._source.category = cmap.get(resp.hits.hits[i]._source.caseNumber);
      // JBT 키를 생성한다
      resp.hits.hits[i]._source.no =  parseInt(i) + no;
      resp.hits.hits[i]._source.jbt_key = resp.hits.hits[i]._source.category + "_" + ( parseInt(i) + no );
      // 파일을 쓴다
      resp.hits.hits[i]._source.talk = resp.hits.hits[i]._source.timeNtalk;
      resp.hits.hits[i]._source.doc_id = resp.hits.hits[i]._source.ifId;
      delete resp.hits.hits[i]._source.timeNtalk;
      ws.write(JSON.stringify(resp.hits.hits[i]._source) + "\n")
      let document ={
        index : "category_collection",
        type : "doc",
        id : resp.hits.hits[i]._source.jbt_key,
        body : {
          doc : {
            jbt_key : resp.hits.hits[i]._source.jbt_key,
            use_yn : "Y",
            doc_id : resp.hits.hits[i]._source.ifId,
            no : parseInt(i) + no,
            //len : resp.hits.hits[i]._source.timeNtalk.length,
            talk : resp.hits.hits[i]._source.timeNtalk,
            category_code : resp.hits.hits[i]._source.category,
            category : common.getCategory(parseInt(resp.hits.hits[i]._source.category))
         } ,
         doc_as_upsert : true
        }
      };
      client.update(document).then(resp => {
        console.log(JSON.stringify(resp))
      });
    }

  } else {
    console.log("no query result")
  }
  //ws.end();
}).catch(err => {console.log(err)});
*/