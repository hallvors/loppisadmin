const Promise = require('bluebird');
const env = require('../../config/env');
const TOKEN = env.nconf.get('sms:token');
const URL = env.nconf.get('sms:apiurl');
const rp = require('request-promise');

const isTest = false;

function send(number, sender, message, param1) {
	let options = {
		uri: URL,
		headers: {
			'Authorization': 'Bearer ' + TOKEN
		},
		qs: {
			from: sender,
			to: number,
			message,
			param1,
			format: 'json'
		},
		json: true,
		test: isTest ? 1 : 0
	}
	return rp(options);
}

module.exports = {
	send
};
