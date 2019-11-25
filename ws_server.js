const WebSocketS = require("ws").Server;
const wss = new WebSocketS({ port : 3000 });
const approot = require('app-root-path');
const config = require(approot + '/config/config');
const fs = require('fs');

// 키워드추출 API

console.log("process.pid:"+process.pid);
// 웹소켓으로 STT 데이터 받기만 하고 TeAnaTextAna API 및 스크립트 합치는 작업은 다른 소스로
wss.on("connection", function(ws){
  // logger.info("WSS" + Date() );
  // keyword로 색인 , 파일 write 경로 다르게. IF_DMA_00001
  ws.on("message", function(message) {
    
    let data = JSON.parse(message);
    let filePath = config.save_path;
    let fileName = filePath + data.startTime + "-" + data.agentId + "-" + data.transType;
    let result = {};

    if( data.ifId !== undefined ){

      result.ifId = data.ifId;
      result.startTime = data.startTime;
      result.extension = data.extension;
      result.agentId = data.agentId;
      
      fs.writeFile(fileName, message, 'utf-8', function(err) {
        if(err) {
            result.code = "99";
            result.message = "파일 수신 실패";
            ws.send(JSON.stringify(result));
        }else{
            result.code = "10";
            result.message = "파일 정상 수신";
            ws.send(JSON.stringify(result));
          }
      });
    } else {
      result.code = "99";
      result.message = "필수값 누락";
      ws.send(JSON.stringify(result));
    }
  });
});
