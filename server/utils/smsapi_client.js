const env = require('../../config/env');
const TOKEN = env.nconf.get('sms:token');
const URL = env.nconf.get('sms:apiurl');

const isTest = false;

function send(number, sender, message, param1) {
	console.log({message});
	const params = new URLSearchParams({
			to: number,
			from: sender,
			message,
			param1,
			format: 'json',
			test: isTest ? 1 : 0
		});
	let options = {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + TOKEN
		},
	}
	console.log(`${URL}?${params.toString()}`)
	return fetch(`${URL}?${params.toString()}`, options);
}

module.exports = {
	send
};
