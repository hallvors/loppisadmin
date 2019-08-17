const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const env = require('./config/env');

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use('/api', require('./server/api'));
app.use('/images', express.static('./client/images'));
app.use('/js', express.static('./client/built/js'));
app.use('/css', express.static('./client/built/css'));
app.use('/', express.static('./client/'));
app.use('/henting', express.static('./client/'));

const server = require('http').createServer();
server.on('request', app);

server.listen(env.PORT, () => {
	console.log(`[ready] http://localhost:${env.PORT}`);
});
