var express = require('express');
var approot = require('app-root-path');
var config = require(approot + '/config/config');
var http = require('http');
var res_err = require(approot + '/lib/res_err');
const winston = require('winston');
//const if0004 = require('./if_dma_00004.js');
//const if0003 = require('./if_dma_00003.js');
const elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ 
  host : '10.253.42.185:9200',
  log: 'trace',
  apiVersion: '6.8' // insert 수행시 필요한 설정
});
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: './logs/index_error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/index.log' })
  ]
});
require('log-timestamp');

module.exports = client;

/************************************************************
 * 크로스 도메인 처리
 ************************************************************/
var corsOptions = {
    origin: true,
    credentials: true
};
var today = "20191113";
//if0003();
//if0004();

var CORS = require('cors')(corsOptions);
var app = express();
app.use(CORS);
app.use(express.json());
app.use("/channel", require("./routes/channel"));
app.use("/keyword", require("./routes/keyword"));
app.use("/class", require("./routes/class"));
app.use("/call", require("./routes/call"));
app.use("/positive", require("./routes/positive"));
app.use("/receive", require("./routes/receive"));
app.use("/product", require("./routes/product"));
app.use("/customer", require("./routes/customer"));
app.use("/voc", require("./routes/voc"));

app.get('/', (req, res) => {
    logger.info("HTTP GET /" + req.ip + Date());
    res.send('ROOT');
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

console.log("process.pid:"+process.pid);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }

  return false;
}

function onListening() {
  var addr = server.address();
}




/************************************************************
 * 에러 처리...
 ************************************************************/
process.on('uncaughtException', function (err) {
  console.error('uncaughtException 발생 : ' + err);
});


 