const env = require('../config/env');

const authTokenSecret = env.nconf.get('site:authTokenSecret');
const baseUrl = env.nconf.get('site:baseUrl');
const jwt = require('jsonwebtoken');

const token = jwt.sign({loppislogin: true}, authTokenSecret, {expiresIn: '2 days'});
console.log('For å logge inn, gå til:');
console.log(baseUrl + '/api/login?token=' + encodeURIComponent(token));
console.log('\nMerk: bare gyldig i to dager.')
