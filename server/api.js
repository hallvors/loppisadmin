const express = require('express');
const router = express.Router({mergeParams: true}); // eslint-disable-line
const env = require('../config/env');
const authTokenSecret = env.nconf.get('site:authTokenSecret');
const jwt = require('jsonwebtoken');
const {getFullList, update} = require('./utils/google_client');
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
// Note: no access restriction for /prefs, caveat emptor
router.get('/prefs', (req, res, next) => {
	res.json({
		head: env.head,
		types: env.nconf.get('types'),
	});
});

// Require valid session for all end points defined below
router.use(requireValidSessionOrToken);

router.get('/helpertoken', (req, res, next) => {
	let token = jwt.sign({helper: true}, authTokenSecret, {expiresIn: '3 days'});
	res.json({token});
});

router.get('/jobs', (req, res,next) => {
	return getFullList(Boolean(req.query.refresh))
	.then(result => res.json(result))
	.catch(next);
});

// /job/:jobnrs endpoint supports fetching one single row ID - or multiple, comma-separated ones
router.get('/job/:jobnrs', (req, res,next) => {
	if (!req.params.jobnrs) {
		res.status(401);
		throw new Error('not allowed');
	}
	return getFullList(false)
	.then(result => {
		let jobnrs = req.params.jobnrs.split(/,/g);
		result = result.filter(row => {
			return jobnrs.includes(row[env.head.JOBNR]);
		});
		res.json(result);
	});
});

router.get('/byperson/:assignee', (req, res,next) => {
	if (!req.params.assignee) {
		res.status(401);
		throw new Error('not allowed');
	}
	return getFullList(false)
	.then(result => {
		result = result.filter(item => {
			return item[env.head.ASSIGNEE] === req.params.assignee;
		});
		res.json(result);
	})
	.catch(next);
});

router.post('/update/:jobnr', (req, res, next) => {
	return update(req.params.jobnr, req.body.details)
	.then(result => {
		res.json(result);
	})
	.catch(next);
});

router.post('/sendsms', (req, res, next) => {
	if (!(req.body.to && req.body.from && req.body.message)) {
		res.status('401');
		res.end();
		return;
	}
	return sendSMS(req.body.to, req.body.from, req.body.message, req.body.param1)
	.then(result => {
		res.json(result);
	})
	.catch(next);
});

module.exports = router;
