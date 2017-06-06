var Rest = {};
[
  'ListAnime',
  'MagnetsAnime',
  'Login',
  'User',
  'ConsoleLog'
].map(name => Rest[name] = new RestEntity(name.toLowerCase()));

var user = user || {};
var routes = routes || {
  '/': () => { new IndexPage() },
  '/anime/*': () => { new AnimePage(); }
};

$.loadTemplates([
  'index-page',
  'anime-page',
  'header',
  'get-shows',
  'anime-list',
  'subscription-list',
  'magnets'
], function(){
  $(()=>{
    new Header(afterLogin);

		function afterLogin(){
			new Router();
		}
  })
});
