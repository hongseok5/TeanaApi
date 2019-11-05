const rp = require('request-promise');
const schedule = require('node-schedule');
const winston = require('winston');
const elasticsearch = require('elasticsearch');
const dateFormat = require('dateformat');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'if_dma_00003' },
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: './logs/if_dma_00003.log' })
    ]
  });
console.log("process.pid:"+process.pid);

var client = new elasticsearch.Client({
    host : '10.253.42.185:9200',
    log: 'trace'
});

client.ping({
    requestTimeout : 100
}, function(err){
    if (err){
        console.trace('down!');
    } else {
        console.log('well');
    }
});

var body = {
    //query : {},
    size : 10
};

client.search({
    index : "call_dev",
    body : body
}).then(function(resp){
    console.log(resp);
    //res.send(resp);
}, function(err){
    console.log(err);
})

var sj01 = schedule.scheduleJob('0 * * * * *', function(){
    console.log("if_dma_00103( rt_pop_keyword ) run!");
    var now = dateFormat(new Date(), "yyyymmddHHMMss");
    var hour_ago = new Date().getHours() - 1 ;
    now = now.slice(0,10) + "0000";
    hour_ago = now.slice(0,8) + hour_ago + "0000";
    options2.body = JSON.stringify(param);
    rp(options2)
    .then(function ( data ){
        data = JSON.parse(data);
        logger.info(data.data.result.data_list);
        //console.log(data.data.result.data_list);
    }).catch(function (err){
        console.error("error sj01 : " + err);
    });
});    

module.exports = getData;