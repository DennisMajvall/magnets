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
  '/': () => { new SubscriptionList(); },
  '/anime/*': () => { new AnimeDetails(); }
};

$.loadTemplates([
  'index-page',
  'anime-details',
  'header',
  'get-shows',
  'anime-list',
  'subscription-list',
  'subscriber-status',
  'magnets'
], function(){
  $(()=>{
    new IndexPage();
    new Header(afterLogin);

    function afterLogin(){
      new Router();
    }
  })
});
