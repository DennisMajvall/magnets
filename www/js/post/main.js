var REST = {};
[
  'ListAnime',
  'MagnetsAnime',
  'Login',
	'ConsoleLog'
].map(name => REST[name] = new RestEntity(name.toLowerCase()));

var user = {};
var routes = {};
routes = {
	'/': () => { new IndexPage() },
	'/login': () => { new LoginPage() },
	'/anime/*': () => { new AnimePage(); }
};

$.loadTemplates([
	'index-page',
	'anime-page',
	'magnets'
], function(){
	$(()=>{
    new Router();
  })
});
