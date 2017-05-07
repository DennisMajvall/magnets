new Router();

var REST = {};
[
  'User',
  'Login'
].map(name => REST[name] = new RestEntity(name.toLowerCase()));

var user = {};
var routes = {
  '/': () => { new IndexPage() },
  '/login': () => { new LoginPage() }
};

(()=>{
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
