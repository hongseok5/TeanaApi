'use strict';
const WebSocketS = require("ws").Server;
const wss = new WebSocketS({ port : 3000 });
const approot = require('app-root-path');
const config = require(approot + '/config/config');
const cron = require('node-cron');
const mergejson = require('mergejson');
const fs = require('fs');

let today = "20191113";
console.log("process.pid:"+process.pid);

wss.on("connection", function(ws){
  logger.info("WSS" + Date() );
  //  keyword로 색인 , 파일 write 경로 다르게. IF_DMA_00001
  ws.on("message", function(message) {
    
    data = JSON.parse(message);
    let filePath = config.save_path;
    let fileName = filePath + data.startTime + "-" + data.extension + "-" + data.transType;
    let result = {};
    delete data.code;
    if( data.ifId !== undefined ){

      result.ifId = data.ifId;
      result.startTime = data.startTime;
      result.extension = data.extension;
      result.agentId = data.agentId;
      //result.transType = data.transType;
      
      fs.writeFile(fileName, message, 'utf-8', function(err) {
        if(err) {
            result.code = "99";
            result.message = "파일 수신 실패";
            ws.send(JSON.stringify(result));
            //console.log('파일 쓰기 실패');
        }else{
            result.code = "10";
            result.message = "파일 정상 수신";
            ws.send(JSON.stringify(result));
            //console.log('파일 쓰기 완료');
          }
      });
    } else {
      result.code = "99";
      result.message = "필수값 누락";
      ws.send(JSON.stringify(result));
      //console.log("필수값 누락");
    }
  });
});


let file_merge_async = function (file_nr, file_nt){
  let file_r;
  let file_t;
  let promiseFile = function (file_name, type) {
    return new Promise(function (resolve, reject) {
          fs.readFile(file_name, 'utf-8' ,(err,data)=>{
              if(err) throw err;
              if(data != undefined){
                type == "R" ? file_r = data : file_t = data;
                resolve();
              } else {
                reject();
              }
          });
    }).catch();
  };

  Promise.all([promiseFile(file_nr, "R"), promiseFile(file_nt, "T")])
           .then(function(){
            mergeTalk(JSON.parse(file_r), JSON.parse(file_t))
            console.log("R : " + file_r );
            console.log("T : " + file_t );
          }).catch("merge file failed!");
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
  merged_data.timeNtalk = merged_talk;

  let merged_data_m = {};
  merged_data_m.source = merged_data; // for logstash

  fs.writeFile(config.write_path + today + "/" + merged_data.startTime + "-" + merged_data.extension + ".JSON", JSON.stringify(merged_data_m), 'utf8', function(err) {
    if(err) 
        console.log('Failed to write file!');
    else
        console.log('Successed to write file!');
        fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.extension + "-R", 
                  config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.extension + "-R", 
                  function(err){
                    if (err) throw err;
                    //console.log("Move Suceess!");    
                  });
        fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.extension + "-T", 
                  config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.extension + "-T", 
                  function(err){
                    if (err) throw err;
                    //console.log("Move Suceess!");    
                  });
  });
};

cron.schedule('* * * * *', () => {

  const file_path = config.save_path;
  let file_list = fs.readdirSync(file_path);
  let file_list_r = file_list.filter(el => /\-R$/.test(el));
  let file_list_t = file_list.filter(el => /\-T$/.test(el));
  for( i in file_list_r ){
    let file_nr = file_list_r[i];
    if(fs.existsSync(file_path + file_nr.substr(0, 19) + "-T")){
      let file_nt = file_nr.substr(0, 19) + "-T";
      file_merge_async(file_path + file_nr, file_path + file_nt);
    }
    /*
    for( j in file_list_t){
      if(file_list_r[i].substr(0, 19) == file_list_t[j].substr(0, 19)){
        console.log(file_list_r[i]);
        file_merge_async(file_path + file_list_r[i], file_path + file_list_t[j]);
      }
    }  
    fs.exists(file_path + file_nr.substr(0, 19) + "-T", function(ex){
      if(ex){
        let file_nt = file_nr.substr(0, 19) + "-T";
        file_merge_async(file_path + file_nr, file_path + file_nt);
      }
    });
    */
  }
});

cron.schedule('0 0 * * *', () => {
 
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  // make directory 
  fs.mkdirSync(config.write_path + year.toString() + month.toString() + day.toString());
  today = year.toString() + month.toString() + day.toString();
 });
