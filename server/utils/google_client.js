const Promise = require("bluebird");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const env = require("../../config/env");
const _ = require("underscore");
let gCred = env.nconf.get("google:auth");
if (typeof gCred === "string") {
	// JSON string from env var..
	gCred = JSON.parse(gCred);
}
const SHEET = env.nconf.get("google:spreadsheet");

let cachedList;
// Headers get cached first time we fetch the file, and
// updated every time. Used in update() which fortunately
// should never happen before the first getFullList()..
// FIXME: if the server does not restart, that is..
let headers;
let lastFetchedTime;

function getDoc() {
	const doc = new GoogleSpreadsheet(SHEET);
	return doc
		.useServiceAccountAuth(gCred)
		.then(() => doc.loadInfo())
		.then(() => doc.sheetsByIndex[0].loadHeaderRow())
		.then(() => doc);
}

function getFullList(force) {
	console.log({ SHEET, force });
	if (
		cachedList &&
		!force &&
		lastFetchedTime &&
		Date.now() - lastFetchedTime.getTime() < 1000 * 60 * 10
	) {
		console.log("Using cached list!");
		return Promise.resolve(cachedList.map((row) => row._rawData));
	}
	return getDoc()
		.then((doc) => {
			headers = doc.sheetsByIndex[0].headerValues;
			return doc.sheetsByIndex[0].getRows({
				offset: 0,
				limit: doc.sheetsByIndex[0].rowCount,
			});
		})
		.then((result) => {
			cachedList = result;
			lastFetchedTime = new Date();
			let promises = [];
			let processed = result.map((row, idx) => {
				const out = row._rawData;
				if (!out[env.cols.JOBNR]) {
					row[headers[env.cols.JOBNR]] = out[env.cols.JOBNR] =
						idx + 1;
					promises.push(row.save());
				}
				if (!out[env.cols.AREA]) {
					let area = getAreaName(out[env.cols.ADDRESS]);
					if (area) {
						row[headers[env.cols.AREA]] = out[env.cols.AREA] = area;
						promises.push(row.save());
					}
				}
				return out;
			});
			return Promise.resolve(promises).then(() => {
				return processed;
			});
		});
}

function update(jobnr, details) {
	if (cachedList) {
		return getDoc().then((doc) => {
			let headers = doc.sheetsByIndex[0].headerValues;

			let row = cachedList.find(
				(row) => row[headers[env.cols.JOBNR]] === jobnr
			);
			if (row) {
				/* Thanks to the crazy flexibility of JS, this loop will
				   handle either sparse arrays or objects with numbers as
				   property names.
				*/
				for (let prop in details) {
					if (typeof details[prop] !== 'undefined') {
						row[headers[prop]] = details[prop];
					}
				}
				return row.save().then(() => {
					return { jobnr, details };
				});
			} else {
				throw new Error("No job to update!");
			}
		});
	} else {
		throw new Error("No cached object to update!");
	}
}

function getAreaName(address) {
	let match;
	if (match = address.match(/^[^0-9]+\d+/)) {
		if (env.osloData[match[0].toLowerCase()]) {
			return env.osloData[match[0].toLowerCase()];
		}
	}
	return '';
}

module.exports = {
	getFullList,
	update,
};
