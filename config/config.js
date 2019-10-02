var approot = require('app-root-path');

var config    = require(approot + '/config/config.json')['local'];

/******************************************
 * 수행 환경
 ******************************************/
console.log("*********** APP Configuration ********************************************************************************");
console.log('app_host=>"' + config.app_host + '", app_port=>' + config.app_port + '", app_timeout=>' + config.app_timeout);
console.log("**************************************************************************************************************");

module.exports = config;

