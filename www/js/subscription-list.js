class SubscriptionList {
	constructor() {
		this.onLogout();
		WATCH('login', this.onLogin, this);

		WATCH('logout', this.onLogout);
	}

	onLogin(){
		if (user && user.animes){
			let ids = user.animes.map((o) => { return o.showId;});
			Rest.ListAnime.find(`find/{showId: { $in: [${ids}] }}`, (shows, err) => {
				shows = shows.map(s => {
					s.slug = s.slug.replace('/shows/', '/anime/');
					return s;
				});

				$('.subscription-list').empty().template('subscription-list', { shows: shows });
			});
		}
	}

	onLogout(){
		$('.subscription-list').empty().template('subscription-list', { shows: false });
	}
}
