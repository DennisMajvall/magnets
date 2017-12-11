process.on('unhandledRejection', error=>console.log('unhandledRejection', error));
// Npm modules
var bodyparser = require('body-parser');
var compression = require('compression');
var cookieparser = require('cookie-parser');
var express = require('express');
var http = require('http')
var util = require('util');
var mongoose = require('mongoose');
var sha1 = require('sha1');
var getshows = require('./modules/getshows');
var Sass = require('./modules/sass');
var config = require('./config.json');
require('mongoosefromclass')(mongoose);

global.mongoose = mongoose;
global.sha1 = sha1;
global.passwordSalt = "salt_hidden_on_github";

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
  "Trackers",
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
    let blacklist = [ '/rest/listanime/' ];
    if (blacklist.indexOf(req.url) == -1) {
      res.set("Cache-Control", "no-store, must-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=3600");
    }
  }
  next();
});

// Create restroutes to selected mongoose models
for(let name of restSchemas) {
  new Restrouter(app, global[name]);
}
new Loginhandler(app);

app.use(express.static('www'));

// Start Sass
new Sass(config.sass);

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

app.get('/get-shows/:username/:password', getshows);
app.get('/get-shows', getshows);

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
  // addTrackers();
  // removeTrackers();

  var anime = new HorribleSubs();

  Promise.resolve()
  .then(()=> { return anime.downloadShowlist() })
  .then(()=> { return anime.downloadShowlistIds() })
  .then(()=> { return anime.downloadMagnets() })
  .then(()=> { return anime.downloadShowlistContent() })
  .then(()=> { console.log('HorribleSubs loaded'); })
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

async function removeTrackers(){
  let magnets = await MagnetsAnime.find({}).exec();
  if(!magnets){ console.log('null result'); return; }
  magnets = magnets.splice(1);

  function everyMagnet(m, qual){
    for (let h of m[qual]){
      let newMagnetName = h.magnet.split('&tr=')[0];
      h.magnet = newMagnetName.substr(newMagnetName.lastIndexOf(':')+1);
    }
  }

  for (let m of magnets){
    everyMagnet(m, 'high');
    everyMagnet(m, 'medium');
    everyMagnet(m, 'low');
    m.save();
  }
}

async function addTrackers(){
  let magnets = await MagnetsAnime.find({}).exec();
  if(!magnets){ console.log('null result'); return; }

  let arrOfTrackers = [];

  function everyMagnet(m, qual){
    for (let h of m[qual]){
      if (h.magnet.indexOf('magnet:?') != 0)
        continue;

      let splitted = h.magnet.split('&tr=').splice(1);
      for (let s of splitted){
        if (arrOfTrackers.indexOf(s) == -1) {
          arrOfTrackers.push(s);
        }
      }
    }
  }

  for (let m of magnets){
    everyMagnet(m, 'high');
    everyMagnet(m, 'medium');
    everyMagnet(m, 'low');
  }

  console.log('trackers found');
  for (let t of arrOfTrackers){
    console.log(t);
    Trackers.update(
      { name: t },
      { $setOnInsert:{
        name: t,
        isAnime: true
      }},
      { upsert: true },
      function(err, numAffected) {}
    );
  }
}
