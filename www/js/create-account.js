class CreateAccount {
  constructor() {
    this.hasCreated = false;
    this.renderTemplate();
    WATCH('login', this.renderTemplate, this);
    WATCH('logout', this.renderTemplate, this);
  }

  getLoginDetails(){
    let username = ($('#create-username').val() || '').trim();
    let password = ($('#create-password').val() || '').trim();
    return username && password ? { username: username, password: password } : false;
  }

  createAccount(){
    let body = this.getLoginDetails();
    if (!body) return;

    Rest.User.create(body, (res) => {
      if (res._error) {
        this.renderTemplate(res._error);
      } else {
        this.hasCreated = true;
        delete res.password;
        user = res;
        $('#username').val(body.username);
        $('#password').val(body.password);
		    localStorage.setItem('username', $('#create-username').val());
		    localStorage.setItem('username2', $('#create-password').val());
        BROADCAST('force-login');
      }
    });
  }

  renderTemplate(error = ''){
    $('.middle-part').empty().template('create-account', { user: user, error: error, hasCreated: this.hasCreated });
    $('.create-account').on('click', '#create-button', ()=>{ this.createAccount(); });
    $('.create-account').on('keyup', 'input', (e) => { if (e.originalEvent.key == 'Enter') this.createAccount(); });
    $('.create-account').on('click', '#logout-link', ()=>{ BROADCAST('force-logout'); });
  }
}
