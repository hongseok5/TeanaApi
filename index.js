var express = require('express');
var fs = require('fs');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var http = require('http');
var res_err = require(approot + '/lib/res_err');
var cron = require('node-cron');
var mergejson = require('mergejson');
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

function file_check() {

  const pr_index = 19;    // fnj.lastIndexOf('-')
  const su_index = 20;    // fni.lastIndexOf('-')+1
  const file_path = 'D:\\TeAnaApi\\file'
  let data1;
  let data2;

  cron.schedule('1 * * * * *', function(){

    var file_list = fs.readdirSync(file_path);

    file_list_r = file_list.filter(el => /\-R$/.test(el));
    file_list_t = file_list.filter(el => /\-T$/.test(el));

    for( i in file_list_r ){
      fni = file_list_r[i];

      for ( j in file_list_t ){
        fnj = file_list_t[j];

        if(fnj.substr(0, 19) == fni.substr(0, 19) && fni.substr(20) != fnj.substr(20))

          if(true){
            // 파일명 중복생성되지 않게 체크!
          }  
          
          data1 = fs.readFileSync(file_path + '\\' + fni, 'utf-8' ,(err,data) => {
            if(err) throw err;
          }).toString();

          data2 = fs.readFileSync(file_path + '\\' + fnj, 'utf-8' ,(err,data) => {
            if(err) throw err;
          });

          /* 비동기방식
          fs.readFile(file_path + '\\' + fni, 'utf-8' ,(err,data) => {
            if(err) throw err;
            data1 = data;
            console.log(data1); // 여기선 OK
          });
          */
          mergeTalk(JSON.parse(data1), JSON.parse(data2));
      }
    }
  });
}

function mergeTalk(data1, data2){

  console.log(mergejson(data2, data1));
  /** 
  let merged_talk = [];
  data1.timeNtalk = data1.timeNtalk.split("\n");
  for(i in data1.timeNtalk){
    dialog = data1.timeNtalk[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
      merged_talk.push(dialog);
  }
  data2.timeNtalk = data2.timeNtalk.split("\n");
  for(i in data2.timeNtalk){
    dialog = data2.timeNtalk[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
      merged_talk.push(dialog);
  }

  merged_talk.sort();
  console.log(merged_talk);
    */
}

/************************************************************
 * 에러 처리...
 ************************************************************/
process.on('uncaughtException', function (err) {
  //예상치 못한 예외 처리
  console.error('uncaughtException 발생 : ' + err);
});

