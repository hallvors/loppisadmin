const express = require('express');
const router = express.Router({mergeParams: true}); // eslint-disable-line
const env = require('../config/env');
const authTokenSecret = env.nconf.get('site:authTokenSecret');
const jwt = require('jsonwebtoken');
const {getFullListAsync, updateAsync} = require('./utils/google_client');
const {requireValidSessionOrToken} = require('./utils/middleware');
const sendSMS = require('./utils/smsapi_client').send;

router.get('/login', (req, res, next) => {
	if (!req.query.token) {
		res.status(401);
		throw new Error('not allowed');
	}
	let payload;
	try {
		payload = jwt.verify(req.query.token, authTokenSecret);
	} catch(err) {
		res.status(401);
		throw new Error('not allowed');
	}
	if (payload && payload.loppislogin) {
		let token = jwt.sign({admin: true}, authTokenSecret, {expiresIn: '2 days'});
		res.cookie(
		'adminJwt', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 2,
			path: '/',
		});
		// something about Express or Safari not accepting a cookie during a redirect..?
		res.send(`<html><meta http-equiv="refresh" content="1; url=/" />
		<p>
		Du er nå logget inn og sendes videre til <a href="/">Loppis-admin</a>
		</p>
		</html>`);
		res.end();
		return;
	}
	res.status(401);
	throw new Error('not allowed');
});

// Require valid session for all end points defined below
router.use(requireValidSessionOrToken);

router.get('/helpertoken', (req, res, next) => {
	let token = jwt.sign({helper: true}, authTokenSecret, {expiresIn: '3 days'});
	res.json({token});
});

router.get('/jobs', (req, res,next) => {
	return getFullListAsync(Boolean(req.query.refresh))
	.then(result => res.json(result));
});

// /job/:ids endpoint supports fetching one single row ID - or multiple, comma-separated ones
router.get('/job/:ids', (req, res,next) => {
	if (!req.params.ids) {
		res.status(401);
		throw new Error('not allowed');
	}
	return getFullListAsync(false)
	.then(result => {
		let ids = req.params.ids.split(/,/g)
			.map(id => new RegExp(id + '$', ''));
		result = result.filter(item => {
			return ids.some(idRx => idRx.test(item.id));
		});
		res.json(result);
	});
});

router.post('/update', (req, res, next) => {
	return updateAsync(req.body.id, req.body.details)
	.then(result => {
		res.json(result);
	});
});

router.post('/sendsms', (req, res, next) => {
	if (!(req.body.to && req.body.from && req.body.message)) {
		res.status('401');
		res.end();
		return;
	}
	return sendSMS(req.body.to, req.body.from, req.body.message)
	.then(result => {
		res.json(result);
	});
});

module.exports = router;
