const fs = require('fs');
const rp = require('request-promise');
const cron = require('node-cron');
const schedule = require('node-schedule');
const approot = require('app-root-path');
const config = require(approot + '/config/config');
const common = require(approot + '/routes/common');
const dateformat = require('dateformat');
var winston = require('winston');
const winstonConfig = require(approot + '/lib/logger');
winston.loggers.add("channel_update", winstonConfig.createLoggerConfig("merge"));
var logger = winston.loggers.get("channel_update");
var channel_list = ["01", "02", "03", "04", "05", "06"];
var option = {
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

// 1.channel 디렉토리의 파일을 하나씩 읽어서
// 2.카테고리 유형을 파악한 후에
// 3.제 위치 또는 다른 위치에 파일을 하나씩 쓴다
// 4.로그스태시로 인덱싱
var file_path = "/data/TeAnaApi/file/channel_finished/";

var write_file = function(json_data, file_path){
    return new Promise( (resolve, reject) => {
        fs.writeFile( file_path , JSON.stringify(json_data), function(err){
            if(err)
                logger.error("file write error : ");            
        })            
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
                console.log("rejected");
                reject();
            }
        });
    }).catch();
}

var text_ana = async function(json_data){
    return new Promise( (resolve, reject) => {
        if( json_data.content !== undefined){
            if( json_data.reContent !== undefined){
                option.body.text = json_data.content + json_data.reContent;
            } else {
                option.body.text = json_data.content
            } 
            rp(option).then(value => {
                if(value !== undefined){
                    if(value.output === undefined || (Array.isArray(value.output) && value.output.length === 0)){
                        json_data.analysisCate = "0000000021";     
                        json_data.analysisCateNm = common.getCategory(21);                   
                    } else {
                        let cate_obj = {};
                        if(value.output[0].similarity < 0.75 ){
                            value.output[0] = value.output.slice(0,1)
                        } else {
                            let min_sim = value.output[value.output.length-1].similarity;
                            value.output = value.output.filter( v => {    
                                return v.similarity > min_sim;
                              });
                        }    
                        for( i in value.output ){
                            let obj = {};
                            obj.category = value.output[i].id.substr(0, value.output[i].id.indexOf('_'));
                            obj.score = value.output[i].similarity;
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
                          if( parseFloat(max) < 0.75 ){
                            json_data.analysisCate = "0000000021";
                            json_data.analysisCateNm = common.getCategory(21);        
                          } else {
                            json_data.analysisCate = max_key;
                            json_data.analysisCateNm = common.getCategory(Number(max_key));
                          }            
                    }
                    resolve(json_data);
                } else {
                    console.log("error1 "+JSON.stringify(json_data));
                    reject(json_data);
                }
            });           
        } else {
            console.log("error2 "+JSON.stringify(json_data));
            resolve(json_data);
        }        
    });
}

var sj01 = schedule.scheduleJob('0 * * * * *', function(){
    console.log("01 start")

        let file_list = fs.readdirSync(config.channel_save_path + "01/");
        for(j in file_list){
            read_file(config.channel_save_path + "01/" + file_list[j])
            .then( data => {
                if( data !== undefined ){
                    data.channel = "mobile";
                    return text_ana(data)
                } else {
                    return console.log("data is undefined1")
                }})  
            .catch( err => { console.log(err) })
            .then( data => { 
                if( data !== undefined )
                    return write_file( data, file_path + data.caseId + ".JSON")
                else 
                    return console.log( data.caseId + " data is undefied2") })
            .catch( err => { console.log(err) })  
        }
        console.log("01 finish");
});

var sj02 = schedule.scheduleJob('10 * * * * *', function(){
    console.log("02 start")
    let file_list = fs.readdirSync(config.channel_save_path + "02/");
    for(j in file_list){
        //count++;
        read_file(config.channel_save_path + "02/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "pc";
                return text_ana(data)
            } else {
                return console.log("data is undefined1")
            }})  
        .catch( err => { console.log(err) })
        .then( data => { 
            if( data !== undefined ){
                return write_file( data, file_path + data.caseId + ".JSON")
            }
            else {
                return console.log( data.caseId + " data is undefied2")
            }
        })        
        .catch( err => { console.log(err) })  
    }
    console.log("02 finish");
});

var sj03 = schedule.scheduleJob('20 * * * * *', function(){
    console.log("03 start")
    let file_list = fs.readdirSync(config.channel_save_path + "03/");
    for(j in file_list){
        read_file(config.channel_save_path + "03/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "homepage";
                return text_ana(data)
            } else {
                return console.log("data is undefined1")
            }})  
        .catch( err => { console.log(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return console.log( data.caseId + " data is undefied2") })
        .catch( err => { console.log(err) })  
    }
    console.log("03 finish" );
});

var sj04 = schedule.scheduleJob('30 * * * * *', function(){
    console.log("04 start")

    let file_list = fs.readdirSync(config.channel_save_path + "04/");
    for(j in file_list){
        read_file(config.channel_save_path + "04/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "ars"
                return text_ana(data)
            } else {
                return console.log("data is undefined1")
            }})  
        .catch( err => { console.log(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return console.log( data.caseId + " data is undefied2") })
        .catch( err => { console.log(err) })  
    }
    console.log("04 finish");
});

var sj05 = schedule.scheduleJob('40 * * * * *', function(){
    console.log("05 start")
    let file_list = fs.readdirSync(config.channel_save_path + "05/");
    for(j in file_list){
        read_file(config.channel_save_path + "05/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "chat";
                return text_ana(data);
            } else {
                return console.log("data is undefined1")
            }})  
        .catch( err => { console.log(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return console.log( data.caseId + " data is undefied2") })
        .catch( err => { console.log(err) })  
    }
    console.log("05 finish");
});

var sj06 = schedule.scheduleJob('50 * * * * *', function(){
    console.log("06 start")
    let file_list = fs.readdirSync(config.channel_save_path + "06/");
    for(j in file_list){
        read_file(config.channel_save_path + "06/" + file_list[j])
        .then( data => {
            if( data !== undefined ){
                data.channel = "alliance"
                return text_ana(data)
            } else {
                return console.log("data is undefined1")
            }})  
        .catch( err => { console.log(err) })
        .then( data => { 
            if( data !== undefined )
                return write_file( data, file_path + data.caseId + ".JSON")
            else 
                return console.log( data.caseId + " data is undefied2") })
        .catch( err => { console.log(err) })  
    }
    console.log("06 finish");
});
