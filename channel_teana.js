const fs = require('fs');
const rp = require('request-promise');
const schedule = require('node-schedule');
const approot = require('app-root-path');
const config = require(approot + '/config/config');
const common = require(approot + '/routes/common');

var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');
winston.loggers.add("channel_update", winstonConfig.createLoggerConfig("channel_update"));
var logger = winston.loggers.get("channel_update");

var expt_words = ["곽 빛나", "주문취소"];

var cat_option = {
    uri : 'http://10.253.42.122:12800/txt_to_doc',
    method : "POST",
    body : {
        //t_col : "cl_stt_0210",
        t_col : null,
        text : null,
        mode : "kma",
        combine_xs : true,
        size : 10
    },
    json : true
}

// 키워드추출 API
let kwe_option = {
    uri : 'http://10.253.42.122:12800/txt_to_kwd',
    method : "POST",
    body : {
        mode : "kma",
        t_vec : "wv_stt_0210",
        text : null,
        size : null,
        in_text : true,
        combine_xs : false,
        extract_verb : false,  // default
        ignore_duplicate : true,
        frequency_ratio : 0.5
    },
    json : true
}

  // 키워드추출 API2( 용언추출 )
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

// 1.channel 디렉토리의 파일을 하나씩 읽어서
// 2.카테고리 유형을 파악한 후에
// 3.제 위치 또는 다른 위치에 파일을 하나씩 쓴다
// 4.로그스태시로 인덱싱
var file_path = "/data/TeAnaApi/file/channel_finished/";
var file_backup_path = "/data/TeAnaApi/file/channel/backup/";
const minimum_similarity = 0.76;
var write_file = function(json_data, file_path, isChat){ // chat일 경우 파싱
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

var text_ana = async function(json_data, isChat){
    return new Promise( (resolve, reject) => {
    if(!isChat){
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
        cat_option.body.t_col = "cl_stt_0210";
    } else {
        if(json_data.content !== undefined && json_data.content !== null) {
            cat_option.body.text = json_data.content.replace(/[R|T|"|,|\]|msg|content|type|msgTime|{|}[|:|0-9|a-z|A-Z]/g,"");
            pnn_option.body.text = json_data.content.replace(/[R|T|"|,|\]|msg|content|type|msgTime|{|}[|:|0-9|a-z|A-Z]/g,"");
            kwe_option.body.text = json_data.content.replace(/[R|T|"|,|\]|msg|content|type|msgTime|{|}[|:|0-9|a-z|A-Z]/g,"");
            kwe_option2.body.text = json_data.content.replace(/[R|T|"|,|\]|msg|content|type|msgTime|{|}[|:|0-9|a-z|A-Z]/g,"");
            cat_option.body.t_col = "cl_stt_0210" // 컬렉션 따로
        } else {
            cat_option.body.text = ""
            pnn_option.body.text = ""
            kwe_option.body.text = "" 
            kwe_option2.body.text = ""
            cat_option.body.t_col = "cl_stt_0210" // 컬렉션 따로
        }

    }        
    
    try{
        Promise.all([rp(kwe_option), rp(cat_option), rp(pnn_option), rp(kwe_option2)]).then( values => {
            
            json_data.keyword_count = [];            
            if(values[0].output !== undefined && Array.isArray(values[0].output)){
                values[0].output = values[0].output.filter( v => {
                    return expt_words.indexOf( v.keyword.substr(0, 4)) === -1 ;
                });
                for( i in values[0].output ){
                    json_data.keyword_count.push(values[0].output[i]);
                }
            } 
            if(values[3].verbs !== undefined && Array.isArray(values[3].verbs)){
                for( i in values[3].verbs){
                    let obj = { similarity : 0 };
                    obj.keyword = values[3].verbs[i].expression
                    json_data.keyword_count.push(obj);
                }
            }
            let cate_obj = {};
            if( values[1].output === undefined || (Array.isArray(values[1].output) && values[1].output.length === 0)  ){
              json_data.analysisCate = "0000000021";
              json_data.analysisCateNm = common.getCategory(21);
            } else {
                values[1].output = values[1].output.filter( v => {
                    return v.similarity > minimum_similarity
                })
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
                if( parseFloat(max) < minimum_similarity ){
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

var sj01 = schedule.scheduleJob('0 35 * * * *', function(){
    logger.info("01 start")
    let file_list = fs.readdirSync(config.channel_save_path + "01/");
    for(j in file_list){
        read_file(config.channel_save_path + "01/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "mobile";
                return text_ana(data, false)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyze" + err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON") //여기에 쓴건 로그스태시로 가져가고
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error("write file" + err) }) 
        .then( data => {
            fs.rename(  config.channel_save_path + "01/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("rename file1" + err);
                        })  //여기에
        }).catch( err => { logger.error("rename file2" + err)});                  
    }
    logger.info("01 finish");
}).invoke();

var sj02 = schedule.scheduleJob('10 35 * * * *', function(){
    logger.info("02 start")
    let file_list = fs.readdirSync(config.channel_save_path + "02/");
    for(j in file_list){
        //count++;
        read_file(config.channel_save_path + "02/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "pc";
                return text_ana(data, false)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyze" + err) })
        .then( data => { 
            if( data !== undefined ){
                return write_file( data, file_path + data.caseId + ".JSON")
            }
            else {
                return logger.info( data.caseId + " data is undefied2")
            }
        })        
        .catch( err => { logger.error("file write" + err) }) 
        .then( data => {
            fs.rename(  config.channel_save_path + "02/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("file rename1" + err);
                        })
        }).catch( err => { logger.error("file rename2" + err)});  
    }
    logger.info("02 finish");
}).invoke();

var sj03 = schedule.scheduleJob('20 35 * * * *', function(){
    logger.info("03 start")
    let file_list = fs.readdirSync(config.channel_save_path + "03/");
    for(j in file_list){
        read_file(config.channel_save_path + "03/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "homepage";
                return text_ana(data, false)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyze" + err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error("write file " + err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "03/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("rename file1" + err);
                        })
        }).catch( err => { logger.error("rename file2" + err)}); 
    }
    logger.info("03 finish" );
}).invoke();

var sj04 = schedule.scheduleJob('30 35 * * * *', function(){
    logger.info("04 start")

    let file_list = fs.readdirSync(config.channel_save_path + "04/");
    for(j in file_list){
        read_file(config.channel_save_path + "04/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "ars"
                return text_ana(data, false)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyzer" + err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error("write file" + err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "04/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("rename file1" + err);
                        })
        }).catch( err => { logger.error("rename file2" + err)}); 
    }
    logger.info("04 finish");
}).invoke();

var sj05 = schedule.scheduleJob('40 35 * * * *', function(){
    logger.info("05 start")
    let file_list = fs.readdirSync(config.channel_save_path + "05/");
    //let file_list = fs.readdirSync("./file_channel/20200213");
    for(j in file_list){
        //read_file("./file_channel/20200213/" + file_list[j])
        read_file(config.channel_save_path + "05/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "chat";
                return text_ana(data, true);
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyze" + err) })
        .then( data => { 
            if( data !== undefined ){
                console.log(JSON.stringify(data))
                return write_file( data, file_path + data.caseId + ".JSON")
            } else {
                return logger.info( data.caseId + " data is undefied2") 
            }
        })
        .catch( err => { logger.error("write file" + err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "05/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("rename file1" + err);
                        })
        }).catch( err => { logger.error("rename file2" + err)}); 
    }
    logger.info("05 finish");
}).invoke();

var sj06 = schedule.scheduleJob('50 35 * * * *', function(){
    logger.info("06 start")
    let file_list = fs.readdirSync(config.channel_save_path + "06/");
    for(j in file_list){
        read_file(config.channel_save_path + "06/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "alliance"
                return text_ana(data, false)
            } else {
                return logger.info("data is undefined1")
            }})  
        .catch( err => { logger.error("text analyze" + err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return logger.info( data.caseId + " data is undefied2") })
        .catch( err => { logger.error("write file" + err) })  
        .then( data => {
            fs.rename(  config.channel_save_path + "06/" + data.caseId + ".JSON",
                        file_backup_path + data.caseId + ".JSON",
                        err => {
                            if(err) logger.error("rename file1" + err);
                        })
        }).catch( err => { logger.error("rename file2" + err)}); 
    }
    logger.info("06 finish");
}).invoke();
