import {apiUrl} from './config.js';
import {jobs} from './store.js';

const FROM = '4741238002';

export function changeJobDetails(jobnr, head, newState, token) {
	jobs.update(jobs => {
		// TODO: job used to be object, is now array. This hack should fail..?
		jobs.find(job => job[head.JOBNR] === jobnr).loading = true;
		return jobs;
	});
	let url = apiUrl + '/update/' + jobnr;
	if (token) {
		url += '?token=' + token;
	}
	return fetch(url , {
		method: 'post',
		headers: {'Content-type': 'application/json'},
		body: JSON.stringify({details:  newState}),
	})
	.then(response => response.json())
	.then(data => {
		console.log(data)
		jobs.update(jobs => {
			let theJob = jobs.find(job => job[head.JOBNR] === jobnr);
			theJob.loading = false;
			return jobs;
		});
		return data;
	});
}

export function sendSms(recipients, message) {
	recipients = recipients.map(number => {
			number = number.replace(/\s/g, ''); // no spaces
			return '47' + number; // Norway prefix
		})
		.join(',');
	// support {number} substitution tag
	let param1;
	if (message.indexOf('{number}')) {
		message = message.replace(/\{number\}/g, '[%1%]');
		param1 = recipients.split(/,/g).join('|');
	}
	return fetch(apiUrl + '/sendsms', {
		method: 'post',
		headers: {'Content-type': 'application/json'},
		body: JSON.stringify({
			to: recipients,
			from: FROM,
			message,
			param1
		}),
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		if (data.error) {
			throw new Error(data.message);
		}
		return data;
	})
}
