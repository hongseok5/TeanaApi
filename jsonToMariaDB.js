const mysql = require('mysql');
const fs = require('fs');
const conn = {
    host : '10.253.42.184',
    user : 'ssgtv',
    password : 'ssgtv0930',
    database : 'ssgtv',
    connectionLimit : 50
};

var pool = mysql.createPool(conn);

pool.getConnection(function(err, connection){

  var updateQL = "update ua_call set hum_score = ?, mod_dtm = now() where call_num = ?";
  var insertQL = "insert into ua_call (call_num, start_time, extension, reg_dtm, mod_dtm) values (?,?,?,now(), now())";
  var jsdata = fs.readFileSync('C:\\work\\TeAnaApi\\file\\test_param.json','utf-8' ,(err,data)=>{
    if(err) 
        throw err;
  });
  jsdata = JSON.parse(jsdata);

  var query = connection.query(updateQL, [ jsdata.hum_score, jsdata.call_num ], function (err, rows) {
    if(err){
        connection.release();
        throw err;
    }
    connection.commit(function(err){
        if(err){
            connection.rollback(function(err){
                throw err;
            });
        } else {
            console.log("Updated successfully!");
        }
    });
    connection.release();
  });
});
