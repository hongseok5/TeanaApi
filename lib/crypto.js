var crypto = require('crypto');
var key = crypto.createHash('sha256').update('hashKey').digest('hex'); 
var passDecipher = crypto.createDecipher('aes-256-cbc', key); 
var passCipher = crypto.createCipher('aes-256-cbc', key);

function strdecrypto(str){
	var dbpw = new Buffer(str, 'hex');
	var dbpass = passDecipher.update(dbpw, "hex", "utf8");
	dbpass += passDecipher.final('utf8');
	return dbpass;
}

function strcrypto(str2){
	var cipher = passCipher.update(str2, 'utf-8', 'hex');
	cipher += passCipher.final('hex');
	return cipher;
}

module.exports.strcrypto = strcrypto;
module.exports.strdecrypto = strdecrypto;