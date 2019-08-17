const env = require('../../config/env');
const authTokenSecret = env.nconf.get('site:authTokenSecret');
const jwt = require('jsonwebtoken');

function requireValidSessionOrToken(req, res, next) {
	// middleware might (and does) run before cookie-parser, no req.cookie here.. sigh..
	let cookie = req.headers.cookie;
	let userToken = req.query.token;
	let adminToken;
	if (cookie && cookie.indexOf('adminJwt') > -1) {
		let startidx = cookie.indexOf('adminJwt') + 9; //9 for 'adminJwt='.length
		let endidx = cookie.indexOf(';', startidx)
		if (startidx > -1) {
			if (endidx === -1) {
				endidx = cookie.length;
			}
			adminToken = cookie.substring(startidx, endidx);
		}
	}
	if (!(adminToken || userToken)) {
		res.status(401);
		throw new Error('not allowed');
	}
	try {
		payload = adminToken ?
			jwt.verify(adminToken, authTokenSecret) :
			jwt.verify(userToken, authTokenSecret);
	} catch(err) {
		console.log(err)
		res.status(401);
		throw new Error('not allowed');
	}
	if (!(payload.admin || payload.helper)) {
		res.status(401);
		throw new Error('not allowed');
	}

	return next();
}

module.exports = {
	requireValidSessionOrToken,
};
