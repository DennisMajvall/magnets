module.exports = class User {

	schema() {
		return {
			username: {type: String, required: true},
			password: {type: String, required: true},
			timeCreated: {type: Date, default: Date.now}
		};
	}

	alterSchema(schema) {
		schema.pre('save', function(next) {
			// hash the password	- but only if it has been modified (or is new)
			if (this.isModified('password')) {
				this.password = sha1(this.password + global.passwordSalt);
			}
			if (!this.isModified('username')) {
				next();
				return;
			}

			// check that the user name does not exist
			global.User.findOne({ username: this.username }, (err, foundUser) => {
				if(!foundUser) {
					next();
					return;
				}
				var error = new Error('username `' + foundUser.username + '` is not unique');
				next(error);
			});
		});
	}
}
