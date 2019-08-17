import {apiUrl} from './config.js';
import {jobs} from './store.js';

const FROM = '4741238002';

export function changeJobDetails(id, newState, token) {
	jobs.update(jobs => {
		jobs.find(job => job.id === id).loading = true;
		return jobs;
	});
	let url = apiUrl + '/update';
	if (token) {
		url += '?token=' + token;
	}
	return fetch(url , {
		method: 'post',
		headers: {'Content-type': 'application/json'},
		body: JSON.stringify({id, details:  newState}),
	})
	.then(response => response.json())
	.then(data => {
		console.log(data)
		jobs.update(jobs => {
			let theJob = jobs.find(job => job.id === data.id);
			Object.assign(theJob, data.saved, {loading: false});
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
