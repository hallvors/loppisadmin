const Promise = require('bluebird');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const env = require('../../config/env');
const _ = require('underscore');
let gCred = env.nconf.get('google:auth');
if (typeof gCred === 'string') { // JSON string from env var..
	gCred = JSON.parse(gCred);
}
const SHEET = env.nconf.get('google:spreadsheet');
const fields = [
	'id',
	'tidsmerke',
	'typerlopper',
	'informasjonomloppene',
	'navnpåkontaktperson',
	'adresseforhenting',
	'telefonnummer',
	'hentetidspunktkryssavsåmangedukan',
	'størrelse',
	'status',
	'kvalitet',
	'koordinater',
	'hentesav',
];

let cachedList;
let lastFetchedTime;

function getFullList(force, callback) {
	console.log({force})
	if (cachedList && !force && lastFetchedTime &&
		Date.now() - lastFetchedTime.getTime() < 1000 * 60 * 10
	) {
		console.log('Using cached list!');
		callback(null, cachedList.map(row => _.pick(row, fields)));
		return;
	}
	var doc = new GoogleSpreadsheet(SHEET);
	return async.waterfall([
		next => doc.useServiceAccountAuth(gCred, next),
		(next) => doc.getInfo(next),
		(result, next) => result.worksheets[0].getRows({
			offset: 0, limit: result.worksheets[0].rowCount
		}, next),
		(result, next) => {
			cachedList = result;
			lastFetchedTime = new Date();
			result = result.map(row => _.pick(row, fields));
			next(result);
		}
	], (res) => {
		callback(null, res);
	})
}

function update(id, details, callback) {
	if (cachedList) {
		let row = cachedList.find(row => row.id === id);
		if (row) {
			Object.assign(row, details);
			return row.save((err, result) => {
				let saved = {};
				fields.forEach(f => {saved[f] = result['gsx:' + f]});
				callback(err, {id, saved});
			});
		}
	} else {
		throw new Error('No cached object to update!');
	}
}

module.exports = Promise.promisifyAll({
	getFullList, update
})
