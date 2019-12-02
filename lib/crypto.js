var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var NodeRSA = require('node-rsa');
var key = crypto.createHash('sha256').update('hashKey').digest('hex'); 
var passDecipher = crypto.createDecipher('aes-256-cbc', key); 
var  passCipher = crypto.createCipher('aes-256-cbc', key);

​function pwcrypto(char){
	var cipher = passCipher.update(char, 'utf-8', 'hex');
	cipher += passCipher.final('hex');
	return char;
}

function pwdecrypto(pass){
	var dbpw = new Buffer(pass, 'hex');
	var dbpass = passDecipher.update(dbpw, "hex", "utf8");
	dbpass += passDecipher.final('utf8');
	return dbpass;
}

module.exports.pwcrypto = pwcrypto;
module.exports.pwdecrypto = pwdecrypto;