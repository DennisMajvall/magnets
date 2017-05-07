// Npm modules
var bodyparser = require('body-parser');
var compression = require('compression');
var cookieparser = require('cookie-parser');
var express = require('express');
var HorribleSubs = require('./modules/horriblesubs');
var http = require('http')
var fs = require('fs');
var mongoose = require('mongoose');
var sha1 = require('sha1');
require('mongoosefromclass')(mongoose);

global.mongoose = mongoose;
global.sha1 = sha1;
global.passwordSalt = "salt_hidden_on_github";
// global.appRoot = require('path').normalize(__dirname +'/');

// Stop mongoose from using a deprecated promise library
mongoose.Promise = Promise;

// Load classes, make them global and then convert selected ones to modules
var classesToLoad = [
	"Sessionhandler",
	"Loginhandler",
	"Restrouter",
	"HorribleSubs"
];
var schemasToLoad = [
	"Session",
	"User",
	"ListAnime",
	"MagnetsAnime"
];

for(let name of classesToLoad) {
	let pathName = './modules/' + name.toLowerCase();
	global[name] = require(pathName);
}
for(let name of schemasToLoad) {
	let pathName = './modules/schemas/' + name.toLowerCase();
	global[name] = mongoose.fromClass(require(pathName));
}

var app = express();

app.use(bodyparser.json({ limit: '5mb' }));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(cookieparser());
app.use(new Sessionhandler(Session).middleware());
app.use(compression());

// Never cache request starting with "/rest/"
app.use((req, res, next)=>{
	if(req.url.indexOf('/rest/') >= 0) {
		res.set("Cache-Control", "no-store, must-revalidate");
	}
	next();
});

// Create restroutes to selected mongoose models
new Restrouter(app, User);
new Loginhandler(app);

app.use(express.static('www'));

global.getHtml = function (cb, options, errCb) {

	function doRequest(obj, func, errCb) {
		http.request(options, function(response) {
			let content = "";
			response.setEncoding("utf8");
			response.on("error", (err) => console.log(err));
			response.on("data", (chunk) => { content += chunk; });
			response.on("end", () => {
				if(response.statusCode == 200) {
					cb(content);
				} else if (response.statusCode == 301 && numRedirectsLeft-- > 0) {
					options.path = response.headers.location;
					console.log('redirected to', options.path);
					doRequest(cb, options);
				} else {
					console.log('HTTP FAILED', response.statusCode);
					errCb && errCb();
				}
			});
		}).end();
	}

	let numRedirectsLeft = 3;
	doRequest(cb, options, errCb);
}

app.get('*',(req, res)=>{
	res.sendFile(__dirname + '/www/index.html');
});

// Connect to mongoDB then start the express server
mongoose.connect('mongodb://127.0.0.1/magnets');
mongoose.connection.once('open', onceConnected);
mongoose.connection.on('error', () => console.log('Error connecting to mongoDB'));

function onceConnected() {
    app.listen(3000, function() {
        console.log('Express app listening on port 3000');
    });

	var anime = new HorribleSubs();

	// console.time('Showlist ready');
	// anime.downloadShowlist().then((showsArr) => {
	// 	console.timeEnd('Showlist ready');

	// },(err) => {
	// 	console.log(err);
	// 	console.timeEnd('Showlist ready');
	// });

		// console.time('IDs ready');
		// anime.downloadShowlistIds().then(() => {
		// 	console.timeEnd('IDs ready');

		// }, (err) => {
		// 	console.log('reject', err);
		// 	console.timeEnd('IDs ready');
		// });

			// console.time('magnets');
			// anime.downloadMagnets().then(() => {
			// 	console.log('magnets ready');
			// 	console.timeEnd('magnets');
			// }, (err) => {
			// 	console.log('reject', err);
			// 	console.timeEnd('magnets');
			// });

}

