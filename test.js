
var dateFormat = require('dateformat');
var now = dateFormat(new Date(), "yyyymmddHHMMss");
var hour_ago = new Date().getHours() - 1 ;
var flatten = require('flat');

var obj_flatted = {
    "Mcate" : {
      "type" : "keyword"
    },
    "McateNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "Pcate" : {
      "type" : "keyword"
    },
    "PcateNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "age" : {
      "type" : "long"
    },
    "agentId" : {
      "type" : "keyword"
    },
    "agentNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "category1" : {
      "type" : "keyword"
    },
    "category1Nm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "category2" : {
      "type" : "keyword"
    },
    "category2Nm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "company" : {
      "type" : "keyword"
    },
    "companyNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "gender" : {
      "type" : "keyword"
    },
    "ifId" : {
      "type" : "keyword"
    },
    "inCate" : {
      "type" : "keyword"
    },
    "inCateNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "mdId" : {
      "type" : "keyword"
    },
    "mdNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "productCode" : {
      "type" : "keyword"
    },
    "productNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "reasonCate1" : {
      "type" : "keyword"
    },
    "reasonCate1Nm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "reasonCate2" : {
      "type" : "keyword"
    },
    "reasonCate2Nm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "vdn" : {
      "type" : "keyword"
    },
    "vdnGrp" : {
      "type" : "keyword"
    },
    "vdnGrpNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "vdnNm" : {
      "type" : "keyword",
      "ignore_above" : 256
    },
    "caseId" : {
      "type" : "keyword"
    }
};
var test = Object.entries(obj_flatted)
console.log(test);