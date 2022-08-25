import {apiUrl} from './config.js';
import {jobsData} from './store.js';

const FROM = '4741238002';

export function changeJobDetails(jobnr, cols, newState, token) {
	jobsData.update(jobs => {
		let theJob = jobs.find(job => job[cols.JOBNR] === jobnr)
		// TODO: job used to be object, is now array. This hack should fail..?
		// weirdly it works.. The flexibility of JS and Svelte is amazing
		theJob.loading = true;
		for (let prop in newState) {
			theJob[prop] = newState[prop];
		}
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
		jobsData.update(jobs => {
			let theJob = jobs.find(job => job[cols.JOBNR] === jobnr);
			theJob.loading = false;
			return jobs;
		});
		return data;
	})
	.catch(error => {
		if (confirm('Beklager, kunne ikke oppdatere hentejobben.' +
			'Sannsynligvis vil det fungere om vi laster sida på nytt, ' +
			'men endringer du prøvde å lagre nå må du gjøre på nytt. ' +
			'Klikk OK for å laste på nytt.')) {
			location.reload();
		}
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
