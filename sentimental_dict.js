const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');
const conn = {
    host : '10.253.42.121',
    user : 'ssgtv',
    password : 'ssgtv0930',
    database : 'ssgtv',
    connectionLimit : 50
};
const rp = require('request-promise');
const dateformat = require('dateformat');
// var file_path = "D:\\TeAnaApi\\pos_neg_neu.csv";
// 파일 읽을때는 무조건 큰 따옴표!!!!!!!!!!!!!!!!
// var csvtojson = require('csvtojson');

let option = {
  uri : 'http://10.253.42.122:12800/voc/sentimental/_sync',
  method : "POST",
  body : {
    id : "sent_2",
    extradata : "name=긍부정 평가, user=admin1",
    use : true,
    keywords : []
  },
  json : true
};

var pool = mysql.createPool(conn);
pool.getConnection(function (err, connection){
  let query = "SELECT keyword_id, keyword_type, keyword \
                FROM nx_keyword \
                WHERE use_yn = 'Y' AND keyword_type IN ('01', '05', '06') AND ( mod_dtm >= ? OR reg_dtm >= ? )";  // last value
  connection.query(query, [ dateformat(new Date().setHours(-10), "yyyy-mm-dd HH:MM:ss"), dateformat(new Date().setHours(-10), "yyyy-mm-dd HH:MM:ss") ], function(err, rows){
    if(err){
      connection.release();
      throw err;
    }
    console.log(rows);
    console.log(rows.length);
    connection.release();
    /*
    pos_list = [];
    neg_list = [];
    neu_lest = [];
    for( i in rows){
      if(rows[i].keyword_type == '01'){
        pos_list.push(rows[i]);
      } else if(rows[i].keyword_type == '06') {
        neu_lest.push(rows[i]);
      } else {
        neg_list.push(rows[i]);
      }
    }
  
    for(i in pos_list){
      let keyword_el = {
        id : null,
        extradata : null,
        use : true,
        keyword : null,
        strength : 1,
        synonyms : []
      }
      if(pos_list[i].keyword !== undefined){
        keyword_el.id = "pos-" + pos_list[i].keyword_id;
        keyword_el.keyword = pos_list[i].keyword;
        keyword_el.keyword_type = pos_list[i].keyword_type;
        option.body.keywords.push(keyword_el);
      }
    }
  
    for(i in neg_list){
      let keyword_el = {
        id : null,
        extradata : null,
        use : true,
        keyword : null,
        strength : -1,
        synonyms : []
      }
      if(neg_list[i].keyword !== undefined){
        keyword_el.id = "neg-" + neg_list[i].keyword_id;
        keyword_el.keyword = neg_list[i].keyword;
        keyword_el.keyword_type = neg_list[i].keyword_type;
        option.body.keywords.push(keyword_el);
      }
    }
    for(i in neu_lest){
      let keyword_el = {
        id : null,
        extradata : null,
        use : true,
        keyword : null,
        strength : 0,
        synonyms : []
      }
      if(neu_lest[i].keyword !== undefined){
        keyword_el.id = "neu-" + neu_lest[i].keyword_id;
        keyword_el.keyword = neu_lest[i].keyword;
        keyword_el.keyword_type = neu_lest[i].keyword_type;
        option.body.keywords.push(keyword_el);
      }
    }
    
    rp(option).then(function(data){
      console.log("success!");
      console.log(data);
      console.log(option.body);
    }, function(err){
      console.log(err);
    });
    */
    //connection.release();
  })

});





/*
csvtojson().fromFile(file_path).then((data)=>{
  pos_list = [];
  neg_list = [];
  neu_lest = [];
  for( i in data){
    if(row[i].keyword_type == 1){
      pos_list.push(row[i]);
    } else if(row[i].keyword_type == 0) {
      neu_lest.push(row[i]);
    } else {
      neg_list.push(row[i]);
    }
  }

  for(i in pos_list){
    let keyword_el = {
      id : null,
      extradata : null,
      use : true,
      keyword : null,
      strength : null,
      synonyms : []
    }
    if(row[i].keyword !== undefined){
      keyword_el.id = "pos-" + parseInt(i);
      keyword_el.keyword = row[i].keyword;
      keyword_el.keyword_type = row[i].keyword_type;
      option.body.keywords.push(keyword_el);
    }
  }

  for(i in neg_list){
    let keyword_el = {
      id : null,
      extradata : null,
      use : true,
      keyword : null,
      strength : null,
      synonyms : []
    }
    if(row[i].keyword !== undefined){
      keyword_el.id = "neg-" + parseInt(i);
      keyword_el.keyword = row[i].keyword;
      keyword_el.keyword_type = row[i].keyword_type;
      option.body.keywords.push(keyword_el);
    }
  }
  for(i in neu_lest){
    let keyword_el = {
      id : null,
      extradata : null,
      use : true,
      keyword : null,
      strength : null,
      synonyms : []
    }
    if(row[i].keyword !== undefined){
      keyword_el.id = "neu-" + parseInt(i);
      keyword_el.keyword = row[i].keyword;
      keyword_el.keyword_type = row[i].keyword_type;
      option.body.keywords.push(keyword_el);
    }
  }
  
  rp(option).then(function(data){
    console.log("success!");
    console.log(data);
    console.log(option.body);
  }, function(err){
    console.log(err);
  });
  
}, function(err){
  console.log(err);
});
*/