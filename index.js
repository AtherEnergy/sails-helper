var logger = require('./logger');
var _ = require('lodash');
var moment = require('moment');


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
				// set user
				if (decoded) {
					req.isTokenVerified = true;
					req.user = decoded;
				}
				return next();
			});
		}
	},

	sanitizeHTML: function (req, res, next) {
		var sanitize = require('sanitize-html');
		var sanitizeObject = function (ob) {
			Object.keys(ob).forEach(function (key) {
				if (_.isObject(ob[key]))
					sanitizeObject(ob[key]);
				else if (_.isString(ob[key]))
					ob[key] = sanitize(ob[key]);
			});
		}
		if (req.body) {
			// console.log(typeof req.body);
			sanitizeObject(req.body);
			// console.log('inside sanitizeHTML');
			// console.log(req.body);
			next(null);
		} else {
			next(null);
		}

	},
	//related to sails logger
	getLogger: logger.getLogger,

	rateLimit: function (redis_host) {
		const ratelimiter = require('ratelimiter');
		var redis_db = require('redis').createClient({ host: redis_host });
		return function (req, res, next) { 	// for the time being removing GET requests form rate limiting. TODO: for GET request limiting parameter would be more linient
			if (req.method == 'GET')
				return next();

			// don't rate limit on machine to machine communication
			if (req.user && req.user.is_machine === true)
				return next();

			// req.ip gives you the true proxied ip. id is combination of ip and req path
			var id = req.ip + '_' + req.path;
			// 15 requests are allowed in 2 minute.
			var limit = new ratelimiter({ id: id, db: redis_db, max: 15, duration: 120000 });
			limit.get(function (err, limit) {
				if (err) return next(err);

				res.set('X-RateLimit-Limit', limit.total);
				res.set('X-RateLimit-Remaining', limit.remaining - 1);
				res.set('X-RateLimit-Reset', limit.reset);

				// all good
				sails.log.info('remaining %s/%s from source %s resets at %s', limit.remaining - 1, limit.total, id, new Date(limit.reset * 1000));
				if (limit.remaining) return next();

				// not good
				var after = limit.reset - (Date.now() / 1000) | 0;
				res.set('Retry-After', after);
				res.status(429).json({ satus: 'error', message: 'Rate limit exceeded, retry ' + moment(new Date(limit.reset * 1000)).fromNow() });
			});
		}
	}
}