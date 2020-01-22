const fs = require('fs');
const rp = require('request-promise');
//const cron = require('node-cron');
const schedule = require('node-schedule');
const approot = require('app-root-path');
const config = require(approot + '/config/config');
const common = require(approot + '/routes/common');
//const dateformat = require('dateformat');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');
winston.loggers.add("channel_update", winstonConfig.createLoggerConfig("channel_update"));
var logger = winston.loggers.get("channel_update");
//var channel_list = ["01", "02", "03", "04", "05", "06"];

var cat_option = {
    uri : 'http://localhost:12800/txt_to_doc',
    method : "POST",
    body : {
        t_col : "cl_call_0106",
        text : null,
        mode : "kma",
        combine_xs : true,
        size : 10
    },
    json : true
}

// 키워드추출 API
let kwe_option = {
    uri : 'http://localhost:12800/txt_to_kwd',
    method : "POST",
    body : {
        mode : "kma",
        t_vec : "wv_stt_2",
        text : null,
        in_text : true,
        combine_xs : true,
        extract_verb : false  // default
    },
    json : true
}

  // 키워드추출 API2( 용언추출 )
  let kwe_option2 = {
    uri : 'http://localhost:12800/voc/verb/_analysis',
    method : "POST",
    body : {
        text : null,
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

// 1.channel 디렉토리의 파일을 하나씩 읽어서
// 2.카테고리 유형을 파악한 후에
// 3.제 위치 또는 다른 위치에 파일을 하나씩 쓴다
// 4.로그스태시로 인덱싱
var file_path = "/data/TeAnaApi/file/channel_finished/";
var file_backup_path = "/data/TeAnaApi/file/channel/backup/";

var write_file = function(json_data, file_path){
    return new Promise( (resolve, reject) => {
        fs.writeFile( file_path , JSON.stringify(json_data), function(err){
            if(err)
                logger.error("file write error : " + err);         
            try{
                resolve(json_data);  
            } catch(error) {
                reject(error + JSON.stringify(json_data));
            }
        });            
    });
}

var read_file = async function (file_name){
    return new Promise((resolve, reject) => {
        fs.readFile(file_name, 'utf-8', (err, data)=>{
            if(err)
                logger.error(err);
            if(data !== undefined){
                resolve(JSON.parse(data));
            } else {
                logger.info("rejected");
                reject();
            }
        });
    }).catch();
}

var text_ana = async function(json_data){
    return new Promise( (resolve, reject) => {

    if( json_data.content !== undefined && json_data.content !== null){
        json_data.content = json_data.content.replace(/[\r|\n]/g,"")
    } else {
        json_data.content = "";
    }
    if( json_data.reContent !== undefined && json_data.reContent !== null){
        json_data.reContent = json_data.reContent.replace(/[\r|\n]/g,"");
    } else {
        json_data.reContent = "";
    }
            
    cat_option.body.text = json_data.content + json_data.reContent;
    pnn_option.body.text = json_data.content + json_data.reContent;
    kwe_option.body.text = json_data.content + json_data.reContent;
    kwe_option2.body.text = json_data.content + json_data.reContent;

    try{
        Promise.all([rp(kwe_option), rp(cat_option), rp(pnn_option), rp(kwe_option2)]).then( values => {
            json_data.keyword_count = [];
            for( i in values[0].output ){
                json_data.keyword_count.push(values[0].output[i]);
            }
            /*
            values[0].verbs = values[0].verbs.filter( v => {
                return v.expression.substr(0, 2) !== "예 " && v.expression.substr(0, 2) !== "아 " && v.expression.substr(0, 2) !== "네 ";
            })
            */
            for( i in values[3].verbs){
                let obj = { similarity : 0 };
                obj.keyword = values[3].verbs[i].expression
                json_data.keyword_count.push(obj);
            }
    
            let cate_obj = {};
            if( values[1].output === undefined || (Array.isArray(values[1].output) && values[1].output.length === 0)  ){
              json_data.analysisCate = "0000000021";
              json_data.analysisCateNm = common.getCategory(21);
            } else {
              if(values[1].output[0].similarity < 0.8 ){
                values[1].output = values[1].output.slice(0,1)
              }
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
              if( parseFloat(max) < 0.8 ){
                json_data.analysisCate = "0000000021";
                json_data.analysisCateNm = common.getCategory(21);        
              } else {
                json_data.analysisCate = max_key;
                json_data.analysisCateNm = common.getCategory(Number(max_key));
              }
            }
            json_data.negative_word = [];
            json_data.positive_word = [];
            json_data.neutral_word = [];
        
            // negative 추출
            tmp_array = [];
        
            for(i in values[2].sentimental.negative.keywords){
              tmp_array.push(values[2].sentimental.negative.keywords[i].keyword);
            }
            tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거 
            for( i in tmp_array ){
              let obj = { count : -1 , word : tmp_array[i]};
              json_data.negative_word.push(obj);
            }
            // positive 추출
            tmp_array = [];
            for(i in values[2].sentimental.positive.keywords){
              tmp_array.push(values[2].sentimental.positive.keywords[i].keyword)
            }
            tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
            for(i in tmp_array){
              let obj = { count : 1, word : tmp_array[i]};
              json_data.positive_word.push(obj);
            }
        
            // neutral 추출
            tmp_array = [];
            for(i in values[2].sentimental.neutral.keywords){
              tmp_array.push(values[2].sentimental.neutral.keywords[i].keyword)
            }
            tmp_array = Array.from(new Set(tmp_array)); // 중복 키워드 제거
            for(i in tmp_array){
              let obj = { count : 0, word : tmp_array[i]};
              json_data.neutral_word.push(obj);
            }
            resolve(json_data)
        }, err => {
            if(err)
                logger.error(err);
        });

    } catch(error){
        reject(error);
    }
  });
}

var sj01 = schedule.scheduleJob('0 * * * * *', function(){
    logger.info("01 start")

    let file_list = fs.readdirSync(config.channel_save_path + "01/");
    for(j in file_list){
        read_file(config.channel_save_path + "01/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "mobile";
                return text_ana(data)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error(err) }) 
        .then( data => {
            fs.rename(  config.channel_save_path + "01/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)});                  
    }
    logger.info("01 finish");
});

var sj02 = schedule.scheduleJob('10 * * * * *', function(){
    logger.info("02 start")
    let file_list = fs.readdirSync(config.channel_save_path + "02/");
    for(j in file_list){
        //count++;
        read_file(config.channel_save_path + "02/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "pc";
                return text_ana(data)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined ){
                return write_file( data, file_path + data.caseId + ".JSON")
            }
            else {
                return logger.info( data.caseId + " data is undefied2")
            }
        })        
        .catch( err => { logger.error(err) }) 
        .then( data => {
            fs.rename(  config.channel_save_path + "02/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)});  
    }
    logger.info("02 finish");
});

var sj03 = schedule.scheduleJob('20 * * * * *', function(){
    logger.info("03 start")
    let file_list = fs.readdirSync(config.channel_save_path + "03/");
    for(j in file_list){
        read_file(config.channel_save_path + "03/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "homepage";
                return text_ana(data)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error(err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "03/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)}); 
    }
    logger.info("03 finish" );
});

var sj04 = schedule.scheduleJob('30 * * * * *', function(){
    logger.info("04 start")

    let file_list = fs.readdirSync(config.channel_save_path + "04/");
    for(j in file_list){
        read_file(config.channel_save_path + "04/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "ars"
                return text_ana(data)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error(err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "04/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)}); 
    }
    logger.info("04 finish");
});

var sj05 = schedule.scheduleJob('40 * * * * *', function(){
    logger.info("05 start")
    let file_list = fs.readdirSync(config.channel_save_path + "05/");
    for(j in file_list){
        read_file(config.channel_save_path + "05/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "chat";
                return text_ana(data);
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error(err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "05/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)}); 
    }
    logger.info("05 finish");
});

var sj06 = schedule.scheduleJob('50 * * * * *', function(){
    logger.info("06 start")
    let file_list = fs.readdirSync(config.channel_save_path + "06/");
    for(j in file_list){
        read_file(config.channel_save_path + "06/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "alliance"
                return text_ana(data)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error(err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "06/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error(err);
                        })
        }).catch( err => { logger.error(err)}); 
    }
    logger.info("06 finish");
});
