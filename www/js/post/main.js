new Router();

var REST = {};
[
  'User',
  'Login'
].map(name => REST[name] = new RestEntity(name.toLowerCase()));

// Global objects
var user = {};
var routes = {
  '/': () => { new IndexPage() },
  '/login': () => { new LoginPage() }
};

(()=>{
  // Put templates used by ALL ROLES here
  $.loadTemplates([
    'index-page',
    'loginpage'
  ], start);

  function start() {
    new IndexPage();

    // REST.Login.find((response, err) => {
    // 	if (!response.user) {
    // 		new Loginpage();
    // 	} else {
    // 		// Save currently logged in user
    // 		user = response.user;
    // 		new Router();
    // 	}
    // });
  }
})();
