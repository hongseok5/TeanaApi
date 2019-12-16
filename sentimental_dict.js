const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');
const conn = {
    host : '10.253.42.184',
    user : 'ssgtv',
    password : 'ssgtv0930',
    database : 'ssgtv',
    connectionLimit : 50
};
const rp = require('request-promise');
const dateformat = require('dateformat');

let option = {
  uri : 'http://10.253.42.122:12800/voc/sentimental/_sync',
  method : "POST",
  body : {
    id : "sent_1",
    extradata : "name=긍부정 평가, user=admin1",
    use : true,
    keywords : []
  },
  json : true
};

var pool = mysql.createPool(conn);
pool.getConnection(function (err, connection){
  if(err){
    throw err;
  }
  let query = "SELECT keyword_id, keyword_type, keyword FROM nx_keyword " + 
              "WHERE use_yn = 'Y' AND keyword_type IN ('01', '05', '06') AND ( mod_dtm >= date_add( now(), interval -1 day) OR reg_dtm >= date_add( now(), interval -1 day) )";  // last value
  connection.query(query,  function(err, rows){
    if(err){
      connection.release();
      throw err;
    }
    console.log(rows);
    
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
      connection.release();
      process.exit();
    }, function(err){
      console.log(err);
      connection.release();
      process.exit();
    });
    
  })
});
