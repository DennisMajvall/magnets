class Header {
	constructor(callback) {
		Rest.Login.find((res) => {
			user = res.user;
			callback();

			if (res.user == false){
				this.loadTemplate({});
				this.setPreviousUsernameIfEmpty();
        this.getLoginDetails() && this.sendLoginRequest();
			} else {
				this.loadTemplate(res);
			}
		});
    WATCH('force-login', this.sendLoginRequest, this);
    WATCH('force-logout', this.sendLogoutRequest, this);
	}

	getLoginDetails(){
		let username = ($('#username').val() || '').trim();
		let password = ($('#password').val() || '').trim();
		return username && password ? { username: username, password: password } : false;
	}

	sendLogoutRequest(){
    if (!user) return;
		Rest.Login.delete((res) => {
			user = false;
			this.loadTemplate(res);
			this.setPreviousUsernameIfEmpty();
			BROADCAST('logout');
		});
	}

	setPreviousUsernameIfEmpty(){
    if (user) return;
		let un = $('#username');
		let pw = $('#password');

		let oldUsername = localStorage.getItem('username');
		let oldPw = localStorage.getItem('username2');

		if (!(un.val() || '').trim() && oldUsername) {
			un.val(oldUsername);
		}
    if (!(pw.val() || '').trim() && oldPw) {
			pw.val(oldPw);
		}
	}

	sendLoginRequest(){
		let body = this.getLoginDetails();
		if (!body) return;

		localStorage.setItem('username2', $('#password').val());
    Rest.Login.create(body, (res) => {
      user = res.user;
      this.loadTemplate(res);
      this.setPreviousUsernameIfEmpty();
    });
	}

	createUser(){
		let body = this.getLoginDetails();
		if (body) {
			Rest.User.create(this.getLoginDetails(), (res) => {
				user = res.user;
				this.loadTemplate(res);
			});
		}
	}

	loadTemplate(res){
		$('.header').empty().template('header', { login: res });
		$('.user-box').on('click', '#login', () => { this.sendLoginRequest(); });
		$('.user-box').on('click', '#logout', () => { this.sendLogoutRequest(); });
		$('.user-box').on('keyup', 'input', (e) => { if (e.originalEvent.key == 'Enter') this.sendLoginRequest(); });

		if (res.user) {
			localStorage.setItem('username', res.user.username);
			BROADCAST('login');
			new GetShows();
		}
	}
}