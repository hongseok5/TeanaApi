var WebSocket = require("ws");

var ws = new WebSocket("ws://localhost:3001");
ws.onopen = function(event){
    ws.send("Client message: Hi!");

}

ws.onmessage = function(event){
    console.log("Server message: ", event.data);
}

ws.onerror = function(event){
    console.log("Server error message : " , event.data);
}