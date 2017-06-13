class SubscriptionList {
	constructor() {
		if (!this.onLogin()){
			this.renderTemplate();
    } else {
		  BROADCAST('get-shows');
    }

		WATCH('login', this.onLogin, this);
		WATCH('logout', this.onLogout, this);
	}

	onLogin(){
		if (!user || !user.animes || this.hasLoaded || Router.getRouteFromUrl() != '/')
			return false;

		this.hasLoaded = true;

		let ids = user.animes.map((o) => { return o.showId;});
		Rest.ListAnime.find(`find/{showId: { $in: [${ids}] }}`, (shows, err) => {
			this.shows = shows.map(s => {
				s.slug = s.slug.replace('/shows/', '/anime/');
				return s;
			});

			this.renderTemplate(this.shows);
		});

    return true;
	}

	onLogout(){
		this.hasLoaded = false;
		this.shows = false;
		this.renderTemplate(this.shows);
	}

	renderTemplate(shows){
    if (Router.getRouteFromUrl() != '/') return false;
		$('.middle-part').empty().template('subscription-list', { shows: shows, user: user });
		return !!shows;
	}
}
