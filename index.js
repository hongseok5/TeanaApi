var express = require('express');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var http = require('http');
var res_err = require(approot + '/lib/res_err');
var cron = require('node-cron');
var mergejson = require('mergejson');
var WebSocketS = require("ws").Server;
var wss = new WebSocketS({ port : 3000});
//var Promise = require("bluebird");

require('log-timestamp');

/************************************************************
 * 크로스 도메인 처리
 ************************************************************/
var corsOptions = {
    origin: true,
    credentials: true
};

wss.on("connection", function(ws){
  //ws.send("Server is on");
  ws.on("message", function(message) {
    
    data = JSON.parse(message);
    console.log(message);
    var filePath = config.save_path;
    var fileName = filePath + data.startTime + "-" + data.extension + "-" + data.transType;
    var result = {};
    result.ifld = data.ifld;
    result.startTime = data.startTime;
    result.extension = data.extension;
    result.agentId = data.agentId;
    result.transType = data.transType;
 
    fs.writeFile(fileName, message, 'utf8', function(err) {
      if(err) {
          result.code = "99";
          result.message = "파일 수신 실패";
          ws.send(JSON.stringify(result));
          console.log('파일 쓰기 실패');
      }else{
          result.code = "10";
          result.message = "파일 정상 수신";
          ws.send(JSON.stringify(result));
          console.log('파일 쓰기 완료');
        }
    });

  });
});

var CORS = require('cors')(corsOptions);
var app = express();
app.use(express.json());
app.use(CORS);


app.get('/', (req, res) => {
    res.send('Not Supported!\n');
});

app.post('/', (req, res) => {

  console.log("파일 수신 시작");
	console.log("파일 이름:" + data.startTime + "-" + data.extension + "-" + data.transType);
  var data = JSON.stringify(data);
	var filePath = config.save_path;
  var fileName = filePath + data.startTime + "-" + data.extension + "-" + data.transType;

 
	var result = {};
	result.ifld = data.ifld;
	result.startTime = data.startTime;
	result.extension = data.extension;
	result.agentId = data.agentId;
	
  fs.writeFile(fileName, data, 'utf8', function(err) {
    if(err) {
        result.code = "99";
        result.message = "파일 수신 실패";
        res.send(result);
        console.log('파일 쓰기 실패');
    }else{
        result.code = "10";
        result.message = "파일 정상 수신";
        res.send(result);
        console.log('파일 쓰기 완료');
      }
	});
   
 });

/***********************************************************************
 * 에러처리
 **********************************************************************/
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log("status:" + err.status + " message:" + err.message);

  // render the error page
  res.status(err.status || 500);
  res.send(res_err(req, err.status, err.message));
});


var port = normalizePort(config.app_port);
app.set('port', port);

var timeout = normalizePort(config.app_timeout);
app.set('timeout', timeout);

/***********************************************************************
 * 서버기동
 **********************************************************************/
//var server = http.createServer(app);
//server.listen(port);
//server.setTimeout(timeout);
//server.on('listening', onListening);
//file_check();

console.log("process.pid:"+process.pid);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }

  return false;
}
/*
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
*/
var file_merge_async = function (file_nr, file_nt){
  var file_r;
  var file_t;
  var promiseFile = function (file_name, type) {
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
          }).catch("merge file failed!");
}
/** 
var file_merge_sync = function( file_name_r, file_name_t){
  data_file_r = fs.readFileSync( file_name_r, 'utf-8', (err,data) => {
    if(err) throw err;
  });  
  data_file_t = fs.readFileSync( file_name_t, 'utf-8', (err,data) => {
    if(err) throw err;
  });  
  mergeTalk(JSON.parse(data_file_t), JSON.parse(data_file_r));
}
*/
function mergeTalk( dataT, dataR ){

  dataT.timeNtalkT = dataT.timeNtalk;
  dataR.timeNtalkR = dataR.timeNtalk;
  let merged_talk = []; // 병합한 대화를 담을 배열
  dataT.timeNtalkT = dataT.timeNtalkT.split("\t");

  for(i in dataT.timeNtalkT){
    dialog = dataT.timeNtalkT[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
      // dialog = dialog.replace()
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
  let merged_data = mergejson(dataR,dataT);
  merged_data.timeNtalk = merged_talk;
  //console.log(merged_data);

  fs.writeFile(config.write_path + merged_data.startTime + "-" + merged_data.extension + ".JSON", JSON.stringify(merged_data), 'utf8', function(err) {
    if(err) 
        console.log('Failed to write file!');
    else
        console.log('Successed to write file!');
        fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.extension + "-R", 
                  config.backup_path + merged_data.startTime + "-" + merged_data.extension + "-R", 
                  function(err){
                    if (err) throw err;
                    console.log("Move Suceess!");    
                  });
        fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.extension + "-T", 
                  config.backup_path + merged_data.startTime + "-" + merged_data.extension + "-T", 
                  function(err){
                    if (err) throw err;
                    console.log("Move Suceess!");    
                  });
  });
}

/************************************************************
 * 에러 처리...
 ************************************************************/
process.on('uncaughtException', function (err) {
  //예상치 못한 예외 처리
  console.error('uncaughtException 발생 : ' + err);
});

cron.schedule('2 * * * * *', () => {

  const file_path = config.save_path;
  var file_list = fs.readdirSync(file_path);
  var file_list_m = fs.readdirSync(config.write_path);
  var file_list_r = file_list.filter(el => /\-R$/.test(el));
  var file_list_t = file_list.filter(el => /\-T$/.test(el));

  for( i in file_list_r ){
    file_nr = file_list_r[i];
    let pr_index = file_nr.lastIndexOf('-')
    let su_index = file_nr.lastIndexOf('-')+1
    let file_nt = file_nr.substr(0, pr_index) + "-T";
    fs.stat(file_path + file_nt, (err, stats)=>{
      if(typeof stats == "undefined"){
        console.log("No such file!");  
      } else {
        if(stats.isDirectory()){
          console.log("It's a Directory!");
        } else {
          file_merge_async(file_path + file_nr, file_path + file_nt);      

        }       
      }
    })
    /*
    for ( j in file_list_t ){
      file_nt = file_list_t[j];
      if(file_nt.substr(0, pr_index) == file_nr.substr(0, pr_index) && file_nr.substr(su_index) != file_nt.substr(su_index))     
        file_merge_async(file_path + file_nr, file_path + file_nt);
        //file_merge_sync(file_path + file_nr, file_path + file_nt);  // 동기방식
        //fs.unlinkSync(file_path+file_nt); // 병합하고 파일 삭제?
        //fs.unlinkSync(file_path+file_nr);

      }
    */
    }
});
