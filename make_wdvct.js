const fs = require('fs');
const mergejson = require('mergejson');
//const file_path = '/data/TeAnaApi/file_moved/';
const file_path = 'D:\\TeAnaApi2\\TeanaApi\\file_channel\\';
//const write_path = '/data/'
const write_path = 'D:\\TeAnaApi2\\TeanaApi\\file_channel\\';
const dateformat = require('dateformat');
var wstream = fs.createWriteStream('/data/jbt_' + dateformat(new Date(), "yyyymmddHHMMss") +'.json');

let sub_dirs = fs.readdirSync(file_path);

console.log(sub_dirs.length);
let count_p = 0
let count_np = 0
let total_arr = []

for( let i = 0; i < sub_dirs.length; i++){
    let file_list = fs.readdirSync(file_path + sub_dirs[i] + "/" );
    file_list = file_list.filter(el => /\-R$/.test(el));
    for( let j = 0; j < file_list.length; j++){
        let end_index = file_list[j].lastIndexOf('-');
        let file_name = file_list[j].substr(0, end_index) + "-T";
        if(fs.existsSync(file_path + sub_dirs[i] + "/" + file_name)){
            merge_file(file_path + sub_dirs[i] + "/" + file_list[j], file_path + sub_dirs[i] + "/" + file_name)
            console.log("pair : " + count_p++)
        } else {
            console.log("not pair : " + count_np++)
        }
    }
}

/*
sub_dirs.forEach( function(v, i, a){

    let file_list = fs.readdirSync(file_path + v + "/");
    file_list = file_list.filter(el => /\-R$/.test(el));
    file_list.forEach(value => {
        total_arr.push(file_path + v + "/" + value);
    })
});

console.log(count_p)
console.log(total_arr)

total_arr.forEach( function(value){
    //let start_index = value.lastIndexOf('/');
    let end_index = value.lastIndexOf('-');
    let file_name = value.substr(0, end_index) + "-T";
    if(fs.existsSync(file_name)){
        merge_file(value, file_name)
        console.log("pair : " + count_p++)
    } else {
        console.log("not pair : " + count_np++)
    }
});
*/

function fs_control( file_list ){
    return new Promise(async (resolve, reject) => {
        for(j in file_list){
            if(value.endsWith("-R")){
                let fn_index = value.lastIndexOf('-');
                let file_name = value.substr(0, fn_index) + "-T";
                merge_file( file_path + sub_dirs[0] + "/" + value, file_path + sub_dirs[0] + "/" + file_name);    
            }
        }
    }).catch();
}

function merge_file( fr, ft){
    
    let a = JSON.parse(fs.readFileSync(fr))
    let b = JSON.parse(fs.readFileSync(ft))
    merge_talk(a,b);
}

function merge_talk( dataR, dataT ){

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
    merged_data.timeNtalk = merged_talk.replace( /20\d{12}/g , "");
    dataR.timeNtalkR = dataR.timeNtalkR.replace( /20\d{12}/g , "");
    wstream.write('{ "text" : "' + merged_data.timeNtalk + '"}\n');

}
