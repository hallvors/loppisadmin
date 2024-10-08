const express = require('express');
const {engine} = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const env = require('./config/env');

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.engine('.hbs', engine({extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use('/api', require('./server/api'));
app.use('/images', express.static('./client/images'));
app.use('/js', express.static('./client/built/js'));
app.use('/css', express.static('./client/built/css'));
app.use('/henting', express.static('./client/'));

app.get('/', (req, res, next) => {
	res.sendFile('./client/index.html', {root: __dirname});
});

const server = require('http').createServer();
server.on('request', app);

server.listen(env.PORT, () => {
	console.log(`[ready] http://localhost:${env.PORT}`);
});
