class Header {
	constructor(callback) {
		Rest.Login.find((res) => {
			user = res.user;
			callback();

			if (res.user == false){
				this.loadTemplate({});
				this.setPreviousUsernameIfEmpty();
				// If the user has saved a password for a username in their
				// browser, wait for the browser to auto-fill the password
				setTimeout(() => { this.getLoginDetails() && this.sendLoginRequest();}, 500);
			} else {
				this.loadTemplate(res);
			}
		});
	}

	getLoginDetails(){
		let username = ($('#username').val() || '').trim();
		let password = ($('#password').val() || '').trim();
		return username && password ? { username: username, password: password } : false;
	}

	sendLogoutRequest(){
		Rest.Login.delete((res) => {
			user = false;
			this.loadTemplate(res);
			this.setPreviousUsernameIfEmpty();
			BROADCAST('logout');
		});
	}

	setPreviousUsernameIfEmpty(){
		let un = $('#username');
		let oldUsername = localStorage.getItem('username');
		if (!(un.val() || '').trim() && oldUsername) {
			un.val(oldUsername);
		}
	}

	sendLoginRequest(){
		let body = this.getLoginDetails();
		if (body) {
			Rest.Login.create(body, (res) => {
				user = res.user;
				this.loadTemplate(res);
			});
		}
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
