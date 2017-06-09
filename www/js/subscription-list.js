class SubscriptionList {
	constructor() {
		this.onLogin();

		WATCH('login', this.onLogin, this);
		WATCH('logout', this.onLogout, this);
	}

	onLogin(){
		if (!user || !user.animes || this.hasLoaded)
			return;

		this.hasLoaded = true;

		let ids = user.animes.map((o) => { return o.showId;});
		Rest.ListAnime.find(`find/{showId: { $in: [${ids}] }}`, (shows, err) => {
			this.shows = shows.map(s => {
				s.slug = s.slug.replace('/shows/', '/anime/');
				return s;
			});

			this.renderTemplate(this.shows);
		});
	}

	onLogout(){
		this.hasLoaded = false;
		this.shows = false;
		this.renderTemplate(this.shows);
	}

	renderTemplate(shows){
		$('.subscription-list').empty().template('subscription-list', { shows: shows });
		return !!shows;
	}
}
