require('log-timestamp');
var fs = require('fs');
var mergejson = require('mergejson');

var file1;
var file2;
var file_list = fs.readdirSync('D:\\TeAnaApi\\file\\');
file1 = fs.readFile

var promiseR = function (file_name) {
	return new Promise(function (resolve, reject) {
        fs.readFile(file_name, 'utf-8' ,(err,data)=>{
            if(err) reject('read file failed!');
            file1 = JSON.parse(data);
            file1.timeNtalkT = file1.timeNtalk;
            resolve();
        });
	});
};

var promiseT = function (file_name) {
	return new Promise(function (resolve, reject) {
        fs.readFile(file_name, 'utf-8' ,(err,data)=>{
            if(err) reject('read file failed!');
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
                }).catch("read file failed2!");
}

function mergeTalk( dataT, dataR){

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

module.export = file_merge;