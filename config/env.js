const nconf = require('nconf');
nconf.env('__').argv();
nconf.add('defaults', {type: 'file', file: `${__dirname}/defaults.json`});

module.exports = {
	nconf,
	port: nconf.get('PORT') || 5544
};
