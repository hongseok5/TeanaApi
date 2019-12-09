const fs = require('fs');
const rp = require('request-promise');
var approot = require('app-root-path');
const common = require(approot + '/routes/common');
const elasticsearch = require('elasticsearch');
const dateformat = require('dateformat');
const readline = require('readline');
/**
 * ES 에 indexing된 doc들을 새로운 API 추출값으로 새로 인덱싱할 때의 프로세스
 * Logstash에서 기존에 인덱싱된 데이터를 file로 받는다.
 * 해당 file을 이 소스를 실행하여 새로운 file을 쓴다. 파일명만 파라미터로 준다. 경로는 필요없음.
 * 새로운 file을 다시 logstash로 upsert한다.
 * 키워드추출, 긍부정어추출, 카테고리분류, duration 값 계산만 수행됨.
 */

/*
var client = new elasticsearch.Client({ 
  host : '10.253.42.122:9200',
  log: 'trace',
  apiVersion: '6.8' // insert 수행시 필요한 설정
});
*/
let kwe_option = {
    uri : 'http://10.253.42.122:12800/txt_to_kwd',
    method : "POST",
    body : {
        mode : "kma",
        t_vec : "wv_mobile_1",
        text : null,
        in_text : true,
        combine_xs : true
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
        t_col : "cl_common_1209",
        text : null,
        mode : 'kma',
        combine_xs : true
    },
    json : true
}

//var index_list = ["00", "01", "02", "03", "04", "05", "06" ];
var file_path = "/data/reindexing_data/" + process.argv[2];
//var file_path_local = "./file_write/reindexing_201911330.json";
var resultAt = dateformat(new Date(), "yyyymmddHHMMss");
var wstream = fs.createWriteStream("/data/reindexing_data/result/reindexing_" + resultAt + ".json" );

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
var count2 = 0; // pnn
var count3 = 0; //category 
var count4 = 0; //duration
*/
rl.on('line' , function(line){
       
      getApiResult(line);
      //console.log(`finished : keyword = ${count1}, sentimental = ${count2}, category = ${count3}, duration = ${count4}`);
      //console.log(`result file at ${file_path}result/reindexing_${resultAt}.json`);
})

function getDuration( start, end, es ){
    if (start.length === 14 && end.length === 14) {
      value = common.strToDate(end) - common.strToDate(start);
      value = value / 1000;
      if (value > 0){
        return parseInt( value );
      } else {
        return 0;
      }
    } else {
      return null;
    }
}

/*
async function(rlif){
 rlif.on('line', function(line)
}
*/
function sleep(ms){
  return new Promise( resolve => {
    setTimeout(resolve, ms);
  })
}
var ms = 0;
async function getApiResult( line ){
    //count1++;
    line = JSON.parse(line);
    ms += 50;
    await sleep(ms);
    if(common.getEmpty(line.timeNtalk)){
     kwe_option.body.text = line.timeNtalk;
     pnn_option.body.text = line.timeNtalk;
     cat_option.body.text = line.timeNtalk;
    }
    Promise.all([rp(kwe_option), rp(cat_option),rp(pnn_option)]).then(function(values){

        if( Array.isArray( values[0].output )){
            //console.log("check array true");
            line.keyword_count = values[0].output;    
        } else {
            console.log("check array else" + count1 + JSON.stringify(values[0]));
        }
        
        let cate_obj = {};
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
        line.analysisCateNm = common.getCategory(parseInt(max_key));
        line.negative_word = [];
        line.positive_word = [];
        line.neutral_word = [];
    
        // negative 추출
        tmp_array = [];
        if( Array.isArray( values[2].sentimental.negative.keywords ))
          tmp_array = values[2].sentimental.negative.keywords;
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
        for( i in tmp_array ){
          let obj = { count : -1 , word : tmp_array[i]};
          line.negative_word.push(obj);
        }
        // positive 추출
        tmp_array = [];
        if( Array.isArray( values[2].sentimental.positive.keywords ))
          tmp_array = values[2].sentimental.positive.keywords;
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
        for(i in tmp_array){
          let obj = { count : 1, word : tmp_array[i]};
          line.positive_word.push(obj);
        }
    
        // neutral 추출
        tmp_array = [];
        if( Array.isArray( values[2].sentimental.neutral.keywords ))
          tmp_array = values[2].sentimental.neutral.keywords;
        tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
        for(i in tmp_array){
          let obj = { count : 0, word : tmp_array[i]};
          line.neutral_word.push(obj);
        }
        if( common.getEmpty(line.startTime) && common.getEmpty(line.endTime)){
            line.duration = getDuration( line.startTime, line.endTime , true);
        }
        //console.log( line)
        line = JSON.stringify(line);
        wstream.write(line + "\n");
        count1++;
        console.log(count1 + "th doc writed success!");
      }, function(err){
        if(err)
          console.log("TextAnalysis Server doesn't response :" + count1 + err); 
      });
}
