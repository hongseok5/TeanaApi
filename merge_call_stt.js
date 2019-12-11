const approot = require('app-root-path');
const config = require(approot + '/config/config');
const common = require(approot + '/routes/common');
const cron = require('node-cron');
const schedule = require('node-schedule');
const mergejson = require('mergejson');
const fs = require('fs');
const rp = require('request-promise');
const dateformat = require('dateformat');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');
winston.loggers.add("merge", winstonConfig.createLoggerConfig("merge"));
var logger = winston.loggers.get("merge");

const mysql = require('mysql');
const conn = {
    host : '10.253.42.184',
    user : 'ssgtv',
    password : 'ssgtv0930',
    database : 'ssgtv',
    connectionLimit : 50
};

let day = new Date().getDate();
let month = new Date().getMonth() + 1;
let year = new Date().getFullYear();
var today = year.toString() + (month < 10 ? "0" + month : month.toString()) + (day < 10 ? "0" + day : day.toString());
logger.info("day : " + today);
if(!fs.existsSync(config.backup_path + today)){
  fs.mkdirSync(config.backup_path + today);
  logger.info("day : " + today);
} 


var stop_words = [];
schedule.scheduleJob('0 0 * * * *', function(){
  var pool = mysql.createPool(conn);
  pool.getConnection( function(err, connection){
    let query = "SELECT keyword FROM nx_keyword WHERE use_yn = 'Y' AND keyword_type = '07' AND reg_dtm >= date_add( now(), interval -1 hour)" 
    connection.query( query, function(err, rows){
      if(err){
        connection.release();
        throw err;
      }
      logger.info("query result at " + dateformat(new Date(),'yyyy-mm-dd HH:MM:ss') + " : "  + JSON.stringify(rows));
      if( rows.length == 0 ) console.log("zero result");
      for( i in rows ){
        fs.appendFile('/app/TeAna/TeAnaTextAnalytics-1.2.0/dic/stopword.txt', '\n' +  rows[i].keyword, function(err){ 
	 if(err) throw err;
         console.log("stopword" + rows[i].keyword + " writed");
	});
      }
      //console.log(stop_words);
    });
  })
});

// 키워드추출 API
let kwe_option = {
  uri : 'http://localhost:12800/txt_to_kwd',
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
  uri : 'http://localhost:12800/voc/sentimental/_match',
  method : "POST",
  body : {
      id : "sent_2",
      text : null
  },
  json : true
} 
// 카테고리 분류
let cat_option = {
  uri : 'http://localhost:12800/txt_to_doc',
  method : "POST",
  body : {
      t_col : "cl_common_1211",
      text : null,
      mode : 'kma',
      combine_xs : true
  },
  json : true
}

console.log("process.pid:"+process.pid);

let file_merge_async = function (file_nr, file_nt){
  let promiseFile = function (file_name) {
    return new Promise(function (resolve, reject) {
          fs.readFile(file_name, 'utf-8' ,(err,data)=>{
              if(err)
                logger.error(err);
              if(data !== undefined){
                resolve(JSON.parse(data));
              } else {
                reject("error");
              }
          });
    }).catch();
  };

  Promise.all([promiseFile(file_nr), promiseFile(file_nt)])
           .then(function(values){
            mergeTalk(values[0], values[1]);
          }, function(err){
            console.log(err);
          }).catch();
};

function mergeTalk( dataR, dataT  ){
  // T : SSG , R :CST
  
  dataT.timeNtalkT = dataT.timeNtalk;
  dataR.timeNtalkR = dataR.timeNtalk;
  let merged_talk = []; // 병합한 대화를 담을 배열

  dataT.timeNtalkT = dataT.timeNtalkT.split("\n");
  for(i in dataT.timeNtalkT){
    dialog = dataT.timeNtalkT[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
      dialog = dialog.slice(0, 14) + " T" + dialog.slice(14);
      merged_talk.push(dialog);
  }

  dataR.timeNtalkR = dataR.timeNtalkR.split("\n");  // 스트링을 배열로 변환
  for(i in dataR.timeNtalkR){
    dialog = dataR.timeNtalkR[i].replace(/(^\s*)|(\s*$)/g, ''); // 앞뒤 공백 제거
    if( dialog !== ''){  // 대화내용이 있으면
      dialog = dialog.slice(0, 14) + " R" + dialog.slice(14);
      merged_talk.push(dialog);
    } 
  }
  
  merged_talk.sort();
  merged_talk = merged_talk.join(';');
  merged_talk = merged_talk.replace(/\t/g,':');
  dataR.timeNtalkR = dataR.timeNtalkR.join(';');
  dataR.timeNtalkR = dataR.timeNtalkR.replace(/\t/g, ':');
  dataT.timeNtalkT = dataT.timeNtalkT.join(';');
  dataT.timeNtalkT = dataT.timeNtalkT.replace(/\t/g, ':');
  let merged_data = mergejson(dataR,dataT);
  merged_data.timeNtalk = merged_talk.replace( /20\d{12}/g , "");
  // 키워드 및 긍,부정어 추출시 고객의 대화로만 추출
   
  kwe_option.body.text = dataR.timeNtalkR;
  pnn_option.body.text = dataR.timeNtalkR;
  cat_option.body.text = merged_data.timeNtalk;  

  Promise.all([rp(kwe_option), rp(cat_option),rp(pnn_option)]).then(function(values){
    tmp_karr = [];
    for( i in values[0].output){
    	tmp_karr.push(values[0].output[i]);
    }
    //merged_data.keyword_count = tmp_karr.filter( function(v){ return stop_words.indexOf( v.keyword ) == -1 });
     
    merged_data.keyword_count = tmp_karr;
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
    merged_data.analysisCate = max_key;
    merged_data.analysisCateNm = common.getCategory(parseInt(max_key));
    merged_data.negative_word = [];
    merged_data.positive_word = [];
    merged_data.neutral_word = [];

    // negative 추출
    tmp_array = [];

    for(i in values[2].sentimental.negative.keywords){
      tmp_array.push(values[2].sentimental.negative.keywords[i].keyword);
    }
    tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
    for( i in tmp_array ){
      let obj = { count : -1 , word : tmp_array[i]};
      merged_data.negative_word.push(obj);
    }
    // positive 추출
    tmp_array = [];
    for(i in values[2].sentimental.positive.keywords){
      tmp_array.push(values[2].sentimental.positive.keywords[i].keyword)
    }
    tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
    for(i in tmp_array){
      let obj = { count : 1, word : tmp_array[i]};
      merged_data.positive_word.push(obj);
    }

    // neutral 추출
    tmp_array = [];
    for(i in values[2].sentimental.neutral.keywords){
      tmp_array.push(values[2].sentimental.neutral.keywords[i].keyword)
    }
    tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
    for(i in tmp_array){
      let obj = { count : 0, word : tmp_array[i]};
      merged_data.neutral_word.push(obj);
    }
    merged_data.duration = getDuration( merged_data.startTime, merged_data.endTime , true);
    file_sending = {};
    file_sending.startTime = merged_data.startTime;
    file_sending.extension = merged_data.extension;
    file_sending.agentId = merged_data.agentId;
    file_sending.channel = "00";
    file_sending.category = merged_data.analysisCate;
    file_sending.summary = 
    `${convertDateFormat(merged_data.startTime)}에 ${merged_data.agentNm} 상담원이 ${merged_data.analysisCateNm} 으로 상담을 ${convertDuration(merged_data.duration)} 동안 진행하였습니다.` 
    + putKeyword(merged_data.keyword_count);

    
    fs.writeFile( config.send_save_path + merged_data.startTime + "-" + merged_data.agentId + ".JSON" , JSON.stringify(file_sending), 'utf8', function(err){
      if(err) 
        logger.error("file write fail : " + merged_data.startTime + merged_data.agentId + err);
    });
    fs.writeFile( config.send_smry_path + merged_data.startTime + "-" + merged_data.agentId + ".JSON" , JSON.stringify(file_sending), 'utf8', function(err){
      if(err) 
        logger.error("file write fail : " + merged_data.startTime + merged_data.agentId + err);
    });
    fs.writeFile(config.write_path + merged_data.startTime + "-" + merged_data.agentId + ".JSON", JSON.stringify(merged_data), 'utf8', function(err) {
      if(err) 
        logger.error("file write fail : " + merged_data.startTime + merged_data.agentId + err);
      else
          fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.agentId + "-R", 
                    config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.agentId + "-R", 
                    function(err){
                      if (err)
                        logger.error("file move fail : " + merged_data.startTime + merged_data.agentId + err);
   
                    });
          fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.agentId + "-T", 
                    config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.agentId + "-T", 
                    function(err){
                      if (err)
                        logger.error("file move fail : " + merged_data.startTime + merged_data.agentId + err); 
                    });
    });
  }, function(err){
    if(err)
      logger.error("TextAnalysis Server doesn't response :" + err); 
  });
  
};

cron.schedule('*/5 * * * * *', () => {

  const file_path = config.save_path;
  let file_list = fs.readdirSync(file_path);
  let file_list_r = file_list.filter(el => /\-R$/.test(el));
  let count = 0;
  let count_not_ex = 0;
  for( i in file_list_r ){
    let file_nr = file_list_r[i];
    let fn_index = file_nr.lastIndexOf('-');
    if(fs.existsSync(file_path + file_nr.substr(0, fn_index) + "-T")){
      let file_nt = file_nr.substr(0, fn_index) + "-T";
      file_merge_async(file_path + file_nr, file_path + file_nt);
      count++;
    } else {
      count_not_ex++;
    }
  }
  logger.info(new Date() + "finished : " + count + " not pair : " + count_not_ex);
});

cron.schedule('0 0 * * *', () => {
 
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  today = year.toString() + (month < 10 ? "0" + month : month.toString()) + (day < 10 ? "0" + day : day.toString());
  fs.mkdirSync(config.backup_path + today);  
  logger.info("mkdir " + today);
});

function putKeyword(arr){
  var text = ''
  if( arr.length > 3 ) {
    arr = arr.slice( 0, 3) 	
  }  
  for( i in arr){
    text = text + arr[i].keyword + ','
  }
  text = text + ' 등이 언급되었습니다.'
  return text.replace( ', 등', ' 등');
}

function convertDateFormat( dt ){
  if ( dt.length === 14){
    return `${dt.slice(0,4)}년${dt.slice(4,6)}월${dt.slice(6,8)}일 ${dt.slice(8,10)}시${dt.slice(10,12)}분${dt.slice(12,14)}초`
  } else {
    return dt;
  }
}

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

function convertDuration( value ){
  if ( value > 60 ){
    let min = value / 60;
    let sec = value % 60;
    return parseInt(min) + "분 " + sec + "초 ";
  } else {
    return value + "초";
  }
}

