var WebSocket = require("ws");

var ws = new WebSocket("ws://localhost:3000");
var sendData1 = {"call_num":"000000000000203434","startTime":"20191010114558","extension":"6666", "ifId":"20191010114558-6666","transType": "R", "timeNtalk": "네 안녕하세요"};
var sendData2 = {"call_num":"000000000000203434","startTime":"20191010114558","extension":"6666", "ifId":"20191010114558-6666","transType": "T", "timeNtalk": "안녕하세요 고객님"};

ws.onopen = function(event){
    ws.send(JSON.stringify(sendData1));
    ws.send(JSON.stringify(sendData2));
}

ws.onmessage = function(event){
    console.log("Server message: ", event.data);
}

ws.onerror = function(event){
    console.log("Server error message : " , event.data);
}