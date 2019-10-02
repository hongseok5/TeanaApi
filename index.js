var express = require('express');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var http = require('http');
var res_err = require(approot + '/lib/res_err');
var cron = require('node-cron');
var mergejson = require('mergejson');
//var Promise = require("bluebird");

require('log-timestamp');

/************************************************************
 * 크로스 도메인 처리
 ************************************************************/
var corsOptions = {
    origin: true,
    credentials: true
};
var CORS = require('cors')(corsOptions);

var app = express();
app.use(express.json());
app.use(CORS);

app.get('/', (req, res) => {
    res.send('Not Supported!\n');
});

app.post('/', (req, res) => {

  console.log("파일 수신 시작");
	console.log("파일 이름:" + req.body.startTime + "-" + req.body.extension + "-" + req.body.transType);
	
	var filePath = "D:\\TeAnaApi\\file\\";
  var fileName = filePath + req.body.startTime + "-" + req.body.extension + "-" + req.body.transType;
	var data = JSON.stringify(req.body);
 
	var result = {};
	result.ifld = req.body.ifld;
	result.startTime = req.body.startTime;
	result.extension = req.body.extension;
	result.agentId = req.body.agentId;
	
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
var server = http.createServer(app);
server.listen(port);
server.setTimeout(timeout);
server.on('listening', onListening);
file_check();

console.log("process.pid:"+process.pid);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }

  return false;
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

var promiseR = function (file_name) {
	return new Promise(function (resolve, reject) {
        fs.readFile(file_name, 'utf-8' ,(err,data)=>{
            if(err) reject('read fileR failed!');
            file1 = JSON.parse(data);
            file1.timeNtalkT = file1.timeNtalk;
            resolve();
        });
	});
};

var promiseT = function (file_name) {
	return new Promise(function (resolve, reject) {
        fs.readFile(file_name, 'utf-8' ,(err,data)=>{
            if(err) reject('read fileT failed!');
            file2 = JSON.parse(data);
            file2.timeNtalkR = file2.timeNtalk;
            resolve();
        });
	});
};

var file_merge = function (file_nr, file_nt){
  Promise.all([promiseR(file_nr), promiseT(file_nt)])
           .then(function(){
              mergeTalk(file1,file2)
              }).catch("merge file failed!");
}

function mergeTalk( dataT, dataR ){

  let merged_talk = []; // 병합한 대화를 담을 배열
  dataR.timeNtalkR = dataR.timeNtalkR.split("\n");  // 스트링을 배열로 변환
  for(i in dataR.timeNtalkR){
    dialog = dataR.timeNtalkR[i].replace(/(^\s*)|(\s*$)/g, ''); // 앞뒤 공백 제거
    if( dialog !== '')  // 대화내용이 있으면
      merged_talk.push(dialog);
  }
  dataT.timeNtalkT = dataT.timeNtalkT.split("\n");
  for(i in dataT.timeNtalkT){
    dialog = dataT.timeNtalkT[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
      merged_talk.push(dialog);
  }

  merged_talk.sort();
  let merged_data = mergejson(dataR,dataT)
  merged_data.timeNtalk = merged_talk;
  console.log(merged_data);
}

function file_check() {

  const pr_index = 19;    // file_nt.lastIndexOf('-')
  const su_index = 20;    // file_nr.lastIndexOf('-')+1
  const file_path = 'D:\\TeAnaApi\\file\\'

  cron.schedule('1 * * * * *', function(){

    var file_list = fs.readdirSync(file_path);
    var file_list_r = file_list.filter(el => /\-R$/.test(el));
    var file_list_t = file_list.filter(el => /\-T$/.test(el));

    for( i in file_list_r ){
      file_nr = file_list_r[i];

      for ( j in file_list_t ){
        file_nt = file_list_t[j];

        if(file_nt.substr(0, 19) == file_nr.substr(0, 19) && file_nr.substr(20) != file_nt.substr(20))

          file_merge(file_path + file_nr, file_path + file_nt);
          /** 
          dataR = fs.readFileSync(file_path + '\\' + file_nr, 'utf-8' ,(err,data) => {
            if(err) throw err;
          }).toString();
          */
      }
    }
  });
}

/************************************************************
 * 에러 처리...
 ************************************************************/
process.on('uncaughtException', function (err) {
  //예상치 못한 예외 처리
  console.error('uncaughtException 발생 : ' + err);
});

