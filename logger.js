var util = require('util'),
	winston = require('winston'),
	request = require('request'),
	common = require('winston/lib/winston/common'),
	os = require('os'),
	Transport = require('winston/lib/winston/transports/transport').Transport;

const logstash_http_endpoint = process.env.LOGSTASH_ENDPOINT;

sailsLogLevels = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	verbose: 4,
	debug: 5,
	silly: 6
};

var postToLogstash = function (data, callback) {
	request({
		url: 'http://' + logstash_http_endpoint + ':12345',
		method: 'POST',
		body: data,
		json: true
	}, function (err, response, body) {
		if (err) return callback(err)
		if (!err && response.statusCode == 200)
			return callback(null, true);
	});
}
var logstashErrorTransporter = winston.transports.logstashErrorTransporter = function (options) {

	Transport.call(this, options);
	options = options || {};

	this.json = true;
	this.colorize = false;
	this.prettyPrint = false;
	this.timestamp = typeof options.timestamp !== 'undefined' ? options.timestamp : false;
	this.showLevel = options.showLevel === undefined ? true : options.showLevel;
	this.label = options.label || null;
	this.logstash = false;
	this.depth = options.depth || null;
	this.align = options.align || false;
}
//
// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(logstashErrorTransporter, winston.Transport);

logstashErrorTransporter.prototype.log = function (level, msg, meta, callback) {
	var self = this;

	if (typeof msg !== 'string') {
		msg = '' + msg;
	}

	var output = common.log({
		level: level,
		message: msg,
		meta: meta,
		json: this.json,
		logstash: this.logstash,
		colorize: this.colorize,
		prettyPrint: this.prettyPrint,
		timestamp: this.timestamp,
		showLevel: this.showLevel,
		stringify: this.stringify,
		label: this.label,
		depth: this.depth,
		formatter: this.formatter,
		humanReadableUnhandledException: this.humanReadableUnhandledException
	});

	output = JSON.parse(output);
	delete output.trace;
	//ADD env and service
	output.env = process.env.NODE_ENV
	output.service = process.env.SERVICE
	// after processing the log push to logstash
	postToLogstash(output, callback);
};

module.exports = {
	sailsLogLevels: sailsLogLevels,

	winston: winston,

	// need to call this function for creating a new winston logger instance
	getLogger: function () {
		var logger = new winston.Logger({
			levels: sailsLogLevels,
			exitOnError: false,
			transports: [
				new (winston.transports.Console)({
					name: 'info',
					level: 'info',
					colorize: false,
					handleExceptions: true,
					humanReadableUnhandledException: true,
					timestamp: true
				}),
				new (logstashErrorTransporter)({
					level: 'error',
					handleExceptions: true,
					humanReadableUnhandledException: false,
					timestamp: true
				})
			]
		});
		return logger;
	}

};