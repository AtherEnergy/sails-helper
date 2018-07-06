var logger = require('./logger');
var _ = require('lodash');


module.exports = {
	requestLogger: function (req, res, next) {
		// to ignore - req.url starting with /styles,/js,/semantic,/favicon.ico,/health
		var patt = new RegExp("^\/(js|semantic|styles|favicon|health)");
		if (!patt.test(req.url)) {
			var log = {
				app_env: process.env.NODE_ENV,
				status: 'REQUESTED',
				req_method: req.method,
				req_url: req.url,
				req_body: req.body ? _.cloneDeep(req.body) : {},
				req_query: req.query ? req.query : {},
				req_protocol: req.protocol,
				req_host: req.host,
				req_ip: req.ip,

				req_headers: _.cloneDeep(req.headers),

				req_route_path: (req.route) ? req.route.path : null,

				// user info
				req_user_id: (req.user) ? req.user.id : null,
				req_user_username: (req.user) ? req.user.username : null,
				req_user_details: (req.user) ? req.user : null,
				req_sessionID: req.sessionID,
			};

			// remove sensitive information
			if (log.req_headers.authorization)
				delete log.req_headers.authorization

			if (log.req_body.password)
				delete log.req_body.password


			// for Machine to Machine communication, capture jwt token's decoded data
			if (req.machine && req.machine.machine_name) log.req_machine_name = req.machine.machine_name;

			req._sails.log.info(JSON.stringify(log));

			res.on('finish', function () {
				log.status = 'RESPONDED';
				log.res_status_code = res.statusCode.toString();
				log.res_status_message = res.statusMessage
				log.res_time = (new Date()) - req._startTime;
				log.res_meta = (res.meta) ? res.meta : {};
				req._sails.log.info(JSON.stringify(log));
			});
			//To handle the timeout scenarios
			res.on('close', function () {
				log.status = 'CLOSED';
				log.res_status_code = res.statusCode.toString();
				log.res_status_message = res.statusMessage
				log.res_time = (new Date()) - req._startTime;
				log.res_meta = (res.meta) ? res.meta : {};
				req._sails.log.info(JSON.stringify(log));
			});
		}
		return next();
	},

	startRequestTimer: function startRequestTimer(req, res, next) {
		req._startTime = new Date();
		next();
	},

	jwtMiddleware: function (secret) {
		if (!secret)
			throw Error('Jwt Secret required');

		return function (req, res, next) {
			//parse token
			function parseToken() {
				if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
					return req.headers.authorization.split(' ')[1];
				} else if (req.query && req.query.token) {
					return req.query.token;
				}
				return null;
			}
			var token = parseToken();
			// in no token just pass, policy will take care.
			if (!token) return next();

			require("jsonwebtoken").verify(token, secret, function (err, decoded) {
				if (err) {
					return next();
				}
				// set user
				req.user = decoded
				return next();
			});
		}
	},

	//related to sails logger
	getLogger: logger.getLogger
}
