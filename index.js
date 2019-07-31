const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const env = require('./config/env');

const app = express();

app.use(cookieParser(env.nconf.get('cookieSecret'), {
  httpOnly: true,
  secure: true
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use('/api', require('./server/api'));

const server = require('http').createServer();
server.on('request', app);

server.listen(env.port, () => {
	console.log(`[ready] http://localhost:${env.port}`);
});
