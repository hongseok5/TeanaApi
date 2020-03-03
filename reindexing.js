const fs = require('fs');
const rp = require('request-promise');
var approot = require('app-root-path');
const common = require(approot + '/routes/common');
const dateformat = require('dateformat');
const readline = require('readline');
const sleep = require('sleep')

/**
 * ES 에 indexing된 doc들을 새로운 API 추출값으로 새로 인덱싱할 때의 프로세스
 * Logstash에서 기존에 인덱싱된 데이터를 file로 받는다.
 * 해당 file을 이 소스를 실행하여 새로운 file을 쓴다. 파일명만 파라미터로 준다. 경로는 필요없음.
 * 새로운 file을 다시 logstash로 upsert한다.
 * 키워드추출, 긍부정어추출, 카테고리분류, duration 값 계산만 수행됨.
 */
let kwe_option = {
  uri : 'http://10.253.42.122:12800/txt_to_kwd',
  method : "POST",
  body : {
      mode : "kma",
      t_vec : "wv_stt_0210",
      text : null,
      in_text : true,
      combine_xs : true,
      size : 10,
      ignore_duplicate : true,
      frequency_ratio : 0.5,
      extract_verb : false  // default
  },
  json : true
}

let kwe_option2 = {
  uri : 'http://10.253.42.122:12800/voc/verb/_analysis',
  method : "POST",
  body : {
      text : null,
      adjective : true,
      verb : false
  },
  json : true
}

// 긍부정어 추출 API
let pnn_option = {
  uri : 'http://10.253.42.122:12800/voc/sentimental/_match',
  method : "POST",
  body : {
      id : "sent_2",
      text : null
  },
  json : true
} 

// 카테고리 분류
let cat_option = {
  uri : 'http://10.253.42.122:12800/txt_to_doc',
  method : "POST",
  body : {
      t_col : "cl_stt_0210",
      text : null,
      mode : 'kma',
      combine_xs : true,
      size : 10
  },
  json : true
}

//var file_path = "/data/reindexing_data/source/" + process.argv[2];
var file_path = "./file_bak/" + process.argv[2];
//var file_path_local = "./file_write/reindexing_201911330.json";
var resultAt = dateformat(new Date(), "yyyymmddHHMMss");
//var wstream = fs.createWriteStream("/data/reindexing_data/result/reindexing_" + resultAt + ".json" );
var wstream = fs.createWriteStream("./file_write/reindexing_" + resultAt + ".json" );
var expt_words = ["예 ", "네 ", "그 ", "아 ", "곽 ", "뭐 ", "어 ", "수 ", "그런", "제 ", "이 ", "음 ", "그거", "개 ", "이거", "그것", "저 ", "저기", "아니", "칠 ", "때 ", "팔 "];
var minimum_similarity = 0.76
if( process.argv.length == 3){
    if(fs.existsSync(file_path )){
        console.log(process.argv[2] + "reindexing...");
    } else {
        console.log("no such file");
    }
    
} else {
    console.log("unvalid parameter");
}

const rl = readline.createInterface({
    input : fs.createReadStream( file_path  )
})

var count1 = 0; // kwd
/*
rl.on('line' , function(line){
      sleep.msleep(300)
      getApiResult(line);
})
*/
var count_line = 0
rl.on('line', (line) => {
  //count_line++;
  try{
    line = JSON.parse(line)
    sleep.msleep(100);
    getApiResult(line);
  } catch(err){
    console.log(err)
    console.log(line)
  }

})

/*
function sleep(ms){
  return new Promise( resolve => {
    setTimeout(resolve, ms);
  })
}
var ms = 0;
*/

function getApiResult( line ){
    /*
    try{
      line = JSON.parse(line);
    }catch(err){
      console.log(err)
      return;
    }
    */
    if(common.getEmpty(line.timeNtalk)){
      pnn_option.body.text = line.timeNtalkT;
      cat_option.body.text = line.timeNtalk;
      line.timeNtalkR = line.timeNtalkR.replace( /20\d{12}/g , "");
      line.timeNtalkR = line.timeNtalkR.replace( /R:/g , "");
      kwe_option2.body.text = line.timeNtalkR;
      kwe_option.body.text = line.timeNtalkR;
     }
    if(common.getEmpty(line.timeNtalkR)){
      kwe_option.body.size = parseInt(line.timeNtalkR.length / 10)
    } else {
      kwe_option.body.size = 10;
    }

    Promise.all([rp(kwe_option2),rp(cat_option),rp(pnn_option),rp(kwe_option)]).then(function(values){

        line.keyword_count = [];

        if( Array.isArray( values[3].output)){
          for( i in values[3].output){
            line.keyword_count.push(values[3].output[i])
          }
        }

        values[0].verbs = values[0].verbs.filter( v => {
          return expt_words.indexOf(v.expression.substr(0, 2)) === -1 ;
        });
        if( Array.isArray( values[0].verbs )){
          for(i in values[0].verbs){
            let obj = { similarity : 0 }
            obj.keyword = values[0].verbs[i].expression;
            line.keyword_count.push( obj );
          }   
        } else {
            console.log("check array else" + count1 + JSON.stringify(values[0]));
        }

        for( i in values[0].verbs){
          let obj = { similarity : 0 };
          obj.keyword = values[0].verbs[i].expression
          line.keyword_count.push(obj);
        }
        // category
        let cate_obj = {};
        if( values[1].output === undefined || (Array.isArray(values[1].output) && values[1].output.length === 0)  ){
          line.analysisCate = "0000000021";
          line.analysisCateNm = common.getCategory(21);
        } else {
          values[1].output = values[1].output.filter( v => {
            return v.similarity > minimum_similarity
          })
          if(  values[1].output === undefined || (Array.isArray(values[1].output) && values[1].output.length === 0) ){
            line.analysisCate = "0000000021";
            line.analysisCateNm = common.getCategory(21);
          } else {
            for( i in values[1].output ){
              let obj = {};
              obj.category = values[1].output[i].id.substr(0, values[1].output[i].id.indexOf('_'));
              obj.score = values[1].output[i].similarity;
              if( obj.category in cate_obj){
                cate_obj[obj.category] += obj.score;
              } else {
                cate_obj[obj.category] = obj.score;
              }
            }
            tmp_arr = Object.keys(cate_obj);
            let max = 0;
            let max_key = null;
            for( i in tmp_arr){
              if( cate_obj[tmp_arr[i]] > max ){
                max = cate_obj[tmp_arr[i]]; 
                max_key = tmp_arr[i];
              }
            }
            line.analysisCate = max_key;
            line.analysisCateNm = common.getCategory(Number(max_key));
          }
        }
        
        line.negative_word = [];
        line.positive_word = [];
        line.neutral_word = [];
    
        // negative 추출
        tmp_array = [];
    
        for(i in values[2].sentimental.negative.keywords){
          tmp_array.push(values[2].sentimental.negative.keywords[i].keyword);
        }
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
        for( i in tmp_array ){
          let obj = { count : -1 , word : tmp_array[i]};
          line.negative_word.push(obj);
        }
        // positive 추출
        tmp_array = [];
        for(i in values[2].sentimental.positive.keywords){
          tmp_array.push(values[2].sentimental.positive.keywords[i].keyword)
        }
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
        for(i in tmp_array){
          let obj = { count : 1, word : tmp_array[i]};
          line.positive_word.push(obj);
        }
    
        // neutral 추출
        tmp_array = [];
        for(i in values[2].sentimental.neutral.keywords){
          tmp_array.push(values[2].sentimental.neutral.keywords[i].keyword)
        }
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
        for(i in tmp_array){
          let obj = { count : 0, word : tmp_array[i]};
          line.neutral_word.push(obj);
        }
        
        line = JSON.stringify(line);
        wstream.write(line + "\n");
        count1++;
        console.log(count1 + "th doc writed success!");
      }, function(err){
        if(err)
          console.log("TextAnalysis Server doesn't response :" + count1 + err); 
      });
}
