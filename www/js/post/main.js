var Rest = {};
[
  'ListAnime',
  'MagnetsAnime',
  'Login',
  'User',
  'ConsoleLog'
].map(name => Rest[name] = new RestEntity(name.toLowerCase()));

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
  'header',
  'magnets'
], function(){
  $(()=>{
    new Header();
    new Router();
  })
});
