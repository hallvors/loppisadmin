const nconf = require('nconf');
const {parse} = require('csv-parse/sync');
const fs = require('fs');

nconf.env('__').argv();
nconf.add('defaults', {type: 'file', file: `${__dirname}/defaults.json`});

if (!process.env.google__auth) {
	nconf.add('user', {type: 'file', file: `${__dirname}/gsecrets.json`});
}
nconf.add('overrides', {type: 'file', file: `${__dirname}/overrides.json`});

const f = fs.openSync(__dirname + '/oslo-rodes-by-streets.csv', 'r')
const csvData = fs.readFileSync(f, {encoding: 'utf-8'});
const osloData = {};
for(let i=0, data = parse(csvData, {
	columns: false,
	skip_empty_lines: true
  }); i<data.length; i++) {
	osloData[(data[i][0] + ' ' + data[i][1]).toLowerCase()] = data[i][2];
  };

module.exports = {
	nconf,
	osloData,
	PORT: nconf.get('PORT') || 5544,
	cols: nconf.get('spreadsheet_columns')
};
