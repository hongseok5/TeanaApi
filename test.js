function mergeTalk(data1, data2){
    if(data2 != Object){

    }
    if(data1 != Object){

    }

}

var text = '20191102090615-6820-R'

var dialog1 = { "ifld":"STTTA100",
                "code":"00",
                "startTime":"20191102090615",
                "extension":"6820",
                "agentId":"21006924",
                "agentNm":"홍길동",
                "transType":"T",
                "timeNtalk":"20191102090616 안녕하세요  오홍석입니다\n 20191102090716 배송된 상품이 파손되어 있습니다\n 20191102090706 문의사항이 있습니다\n",
                "kmsCount":12,"negCount":2,"posCount":1,"prhCount":1}

dialog1.timeNtalk = dialog1.timeNtalk.split("\n");
console.log(dialog1.timeNtalk);

timeAndTalk = [];
for(s in dialog1.timeNtalk){

    t = dialog1.timeNtalk[s].replace(/(^\s*)|(\s*$)/g, ''); 
    if( t !== '')
        timeAndTalk.push(t);
}
timeAndTalk.sort();
console.log(timeAndTalk);


module.exports = mergeTalk;