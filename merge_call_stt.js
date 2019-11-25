const approot = require('app-root-path');
const config = require(approot + '/config/config');
const cron = require('node-cron');
const mergejson = require('mergejson');
const fs = require('fs');
const rp = require('request-promise');
let today = "20191125";
// 키워드추출 API
let kwe_option = {
  uri : 'http://10.253.42.185:12800/txt_to_kwd',
  method : "POST",
  body : {
      mode : "kma",
      t_vec : "mobile_test",
      text : null
  },
  json : true
}
// 긍부정어 추출 API
let pnn_option = {
  uri : 'http://10.253.42.185:12800/voc/sentimental/_match',
  method : "POST",
  body : {
      id : "sent8",
      text : null
  },
  json : true
} 

let cat_option = {

}

console.log("process.pid:"+process.pid);

let file_merge_async = function (file_nr, file_nt){
  let promiseFile = function (file_name) {
    return new Promise(function (resolve, reject) {
          fs.readFile(file_name, 'utf-8' ,(err,data)=>{
              if(err) throw err;
              if(data !== undefined){
                resolve(JSON.parse(data));
              } else {
                reject("error");
              }
          });
    }).catch();
  };

  Promise.all([promiseFile(file_nr), promiseFile(file_nt)])
           .then(function(values){
            mergeTalk(values[0], values[1]);
          }, function(err){
            console.log(err);
          }).catch();
};

function mergeTalk( dataR, dataT  ){
  // T : SSG , R :CST
  
  dataT.timeNtalkT = dataT.timeNtalk;
  dataR.timeNtalkR = dataR.timeNtalk;
  let merged_talk = []; // 병합한 대화를 담을 배열

  dataT.timeNtalkT = dataT.timeNtalkT.split("\n");
  for(i in dataT.timeNtalkT){
    dialog = dataT.timeNtalkT[i].replace(/(^\s*)|(\s*$)/g, '');
    if( dialog !== '')
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
  merged_talk = merged_talk.join(';');
  merged_talk = merged_talk.replace(/\t/g,':');
  dataR.timeNtalkR = dataR.timeNtalkR.join(';');
  dataR.timeNtalkR = dataR.timeNtalkR.replace(/\t/g, ':');
  dataT.timeNtalkT = dataT.timeNtalkT.join(';');
  dataT.timeNtalkT = dataT.timeNtalkT.replace(/\t/g, ':');
  let merged_data = mergejson(dataR,dataT);
  merged_data.timeNtalk = merged_talk;
  // 키워드 및 긍,부정어 추출시 고객의 대화로만 추출
   
  kwe_option.body.text = dataR.timeNtalkR;
  pnn_option.body.text = dataR.timeNtalkR;
  
  Promise.all([rp(kwe_option), rp(pnn_option)]).then(function(values){
    
    merged_data.keyword_count = values[0].output;
    merged_data.negative_word = [];
    merged_data.positive_word = [];
    merged_data.neutral_word = [];
    /*
    for(i in values[1].sentimental.negative.keywords){
      let obj = { count : -1, word : values[1].sentimental.negative.keywords[i].keyword};
      merged_data.negative_word.push(obj);
    }
    for(i in values[1].sentimental.positive.keywords){
      let obj = { count : 1, word : values[1].sentimental.positive.keywords[i].keyword};
      merged_data.positive_word.push(obj);
    }
    for(i in values[1].sentimental.neutral.keywords){
      let obj = { count : 0, word : values[1].sentimental.neutral.keywords[i].keyword};
      merged_data.neutral_word.push(obj);
    }
    */   
    //console.log("test2 : " + merged_data.startTime + merged_data.agentId);
    fs.writeFile(config.write_path + today + "/" + merged_data.startTime + "-" + merged_data.agentId + ".JSON", JSON.stringify(merged_data), 'utf8', function(err) {
      if(err) 
          console.log('Failed to write file!');
      else
          fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.agentId + "-R", 
                    config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.agentId + "-R", 
                    function(err){
                      if (err) console.log( err);
   
                    });
          fs.rename(config.save_path + merged_data.startTime + "-" + merged_data.agentId + "-T", 
                    config.backup_path + today + '/' + merged_data.startTime + "-" + merged_data.agentId + "-T", 
                    function(err){
                      if (err) console.log( err);
    
                    });
    });
  }, function(err){
    if(err) throw err;
  });
  
};

cron.schedule('*/5 * * * * *', () => {
  const file_path = config.save_path;
  let file_list = fs.readdirSync(file_path);
  let file_list_r = file_list.filter(el => /\-R$/.test(el));
  let file_list_t = file_list.filter(el => /\-T$/.test(el));
  console.log("check file_nr list : " + file_list_r);
  let count = 0;
  let count_not_ex = 0;
  for( i in file_list_r ){
    let file_nr = file_list_r[i];
    let fn_index = file_nr.lastIndexOf('-');
    if(fs.existsSync(file_path + file_nr.substr(0, fn_index) + "-T")){
      let file_nt = file_nr.substr(0, fn_index) + "-T";
      //console.log( file_nr + file_nt );
      file_merge_async(file_path + file_nr, file_path + file_nt);
      count++;
    } else {
      count_not_ex++;
    }
  }
  console.log(new Date() + "finished : " + count + " not pair : " + count_not_ex);
});

cron.schedule('0 0 * * *', () => {
 
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  fs.mkdirSync(config.write_path + year.toString() + month.toString() + day.toString());
  fs.mkdirSync(config.backup_path + year.toString() + month.toString() + day.toString());
  today = year.toString() + month.toString() + day.toString();
});
