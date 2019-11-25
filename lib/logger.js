var approot = require('app-root-path');
var config = require(approot + '/config/config');
var moment = require('moment');
var winston = require('winston');
var winston_daily_rotate_file = require('winston-daily-rotate-file');
var fs = require('fs');

function timestampFormat() {
	return moment().format('YYYY-MM-DD HH:mm:ss');
};

if (!fs.existsSync(config.log_path)) {
  fs.mkdirSync(config.log_path);
}

const DEFAULT_LABEL = 'index';

function createLoggerConfig(label) {
	return {
		level : 'debug',
		transports: [
			new winston.transports.DailyRotateFile(
				{	
					level: 'debug',
					filename: config.log_path + `teanapi_%DATE%.log`,
					datePattern: 'YYYY-MM-DD',
					timestamp: timestampFormat,
					zippedArchive: true,
					showLevel: true,
					json: true, // 로그형태를 json으로도 뽑을 수 있다.
					colorize: false,
					format: winston.format.combine(
						winston.format.label({label: label}),
						winston.format.timestamp({
							format: moment().format('YYYY-MM-DD HH:mm:ss')
						}),
						winston.format.printf(
							info => `${info.timestamp} [${info.label}] ${info.level} ${info.message}`
						)
					)
				}				
			),
			new winston.transports.Console(
				{
					level: 'debug',
					timestamp: timestampFormat,
					showLevel: true,
					json: false, 
					colorize: false
				}				
			)
		]
	};
}

winston.loggers.add(DEFAULT_LABEL, createLoggerConfig(DEFAULT_LABEL));

module.exports.defaultLogger = winston.loggers.get(DEFAULT_LABEL);

module.exports.createLoggerConfig = createLoggerConfig;

