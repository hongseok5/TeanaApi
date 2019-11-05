
var dateFormat = require('dateformat');
var now = dateFormat(new Date(), "yyyymmddHHMMss");
var hour_ago = new Date().getHours() - 1 ;
var flatten = require('flat');

var obj_flatted = flatten({
    key1: {
        keyA: 'valueI'
    },
    key2: {
        keyB: 'valueII'
    },
    key3: { a: { b: { c: 2 } } }
})

console.log(obj_flatted);