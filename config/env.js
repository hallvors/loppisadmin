const nconf = require('nconf');
nconf.env('__').argv();
nconf.add('defaults', {type: 'file', file: `${__dirname}/defaults.json`});

if (!process.env.google__auth) {
	nconf.add('user', {type: 'file', file: `${__dirname}/gsecrets.json`});
}
nconf.add('overrides', {type: 'file', file: `${__dirname}/overrides.json`});

const head = require('./headerconstants');

module.exports = {
	nconf,
	PORT: nconf.get('PORT') || 5544,
	head,
};
