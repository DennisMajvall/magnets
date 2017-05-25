// Npm modules
var bodyparser = require('body-parser');
var compression = require('compression');
var cookieparser = require('cookie-parser');
var express = require('express');
var http = require('http')
var util = require('util');
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
var modulesToLoad = [
	"Sessionhandler",
	"Loginhandler",
	"Restrouter",
	"HorribleSubs"
];
var schemas = [ "Session" ];
var restSchemas = [
	"User",
	"ListAnime",
	"MagnetsAnime",
	"ConsoleLog"
];

for(let name of modulesToLoad) {
	let pathName = './modules/' + name.toLowerCase();
	global[name] = require(pathName);
}
for(let name of [...schemas, ...restSchemas]) {
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
for(let name of restSchemas) {
	new Restrouter(app, global[name]);
}
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
					console.log('HTTP statusCode:', response.statusCode);
					errCb && errCb();
				}
			});
		}).end();
	}

	let numRedirectsLeft = 3;
	doRequest(cb, options, errCb);
}

async function getShows(req, res){
	let user = req.session.content.user;
	if(!user){
		res.json([]);
		return;
	}
	let result = [];

	let animes = user.animes || [];
	for (let anime of animes){
		let highestEp = anime.episode;
		let magnets = await MagnetsAnime.findOne({showId: anime.showId}).exec();

		function loopThroughQuality(quality) {
			for (let epMagnet of magnets[quality]){
				if (epMagnet.episode > anime.episode){
					result.push(epMagnet.magnet);
					highestEp = Math.max(highestEp, epMagnet.episode);
				}
			}
			anime.episode = highestEp;
		}

		loopThroughQuality(user.quality);
		if (!user.exclusiveQuality) {
			user.quality == 'high' && (loopThroughQuality('medium'));
			user.quality == 'medium' && (loopThroughQuality('low'));
		}
	}

	if (result.length){
		let newUser = await User.findOne({_id: user._id}).exec()
		.catch((e) => { console.log('catch newUser', e); });

		newUser.animes = user.animes;
		newUser.save();
	}

	res.json(result);
}
app.get('/get-shows', getShows);

app.get('*',(req, res)=>{
	res.sendFile(__dirname + '/www/index.html');
});

function monkeyPatchConsoleLog(){
	var original = console.log;
	console.log = function dbConsoleLog() {
		original.apply(console, arguments);
		new ConsoleLog({ text: util.inspect([...arguments]) }).save();
	}
}
monkeyPatchConsoleLog();

// Connect to mongoDB then start the express server
mongoose.connect('mongodb://127.0.0.1/magnets');
mongoose.connection.once('open', onceConnected);
mongoose.connection.on('error', () => console.log('Error connecting to mongoDB'));

function onceConnected() {
	var anime = new HorribleSubs();

	anime.loadDb()
	// .then(()=> { return anime.downloadMagnets() })
	// .then(()=> { console.log('HorribleSubs loaded'); })
	.then(() => {
		console.log('HorribleSubs RSS enabled');
		anime.readRSS();
		setInterval(() => { anime.readRSS(); }, 600000);
	})
	.then(() => {
		app.listen(3000, function() {
			console.log('Express app listening on port 3000');
    });
	});
}

