class AnimeDetails {
	constructor() {
		let param = location.pathname;
		if (param && param[param.length - 1] != '/') { param += '/'; }
		param = param.replace('/anime/', '/shows/');

		Rest.ListAnime.find(`find/{ slug: "${param}" }`, (shows) => {
			for (let show of shows) {
				this.show = show;
		    WATCH('shows-downloaded', this.renderSubscriberTemplate, this);
		    WATCH('login', this.renderSubscriberTemplate, this);
		    WATCH('logout', this.renderSubscriberTemplate, this);

        $('.middle-part').template('anime-details', { show: this.show });
        this.renderSubscriberTemplate();

				$('subscriber-status').on('click', '#update', (e)=>{this.updateEpisode(e)});
				$('subscriber-status').on('click', '#subscribe', (e)=>{this.subscribe(e)});
				$('subscriber-status').on('click', '#unsubscribe', (e)=>{this.unsubscribe(e)});

				this.loadMagnets();
			}
		});
	}

	loadMagnets(){
		Rest.MagnetsAnime.find(`find/{ showId: ${this.show.showId} }`, (magnets) => {
			for (let magnet of magnets) {
				function sortEp(a,b) { return a.episode < b.episode; }
				magnet.low.sort(sortEp);
				magnet.medium.sort(sortEp);
				magnet.high.sort(sortEp);

				$('magnets').template('magnets', magnet);
			}
		});
	}

	updateEpisode(e){
    if (!user) return;
		let showIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
		if (showIndex == -1) return;

		let episode = $('#last-seen-episode').val() / 1;
		user.animes[showIndex].episode = episode;
		this.updateSubscribeStatus(()=>{ BROADCAST('login'); });
	}

	subscribe(e){
    if (!user) return;
		user.animes.push({showId: this.show.showId, episode: 0 });
		this.updateSubscribeStatus();
	}

	unsubscribe(e){
    if (!user) return;
		let episodeIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
		if (episodeIndex == -1) return;

		user.animes.splice(episodeIndex, 1);
		this.updateSubscribeStatus();
	}

	updateSubscribeStatus(callback){
		if (this.startedUpdating) return;
		this.startedUpdating = true;

		Rest.User.update(user._id, { animes: user.animes },()=>{
			Rest.Login.update(() => {
        this.renderSubscriberTemplate();
        this.startedUpdating = false;
        typeof callback == 'function' && callback();
			});
		});
	}

  renderSubscriberTemplate(){
    this.subscriberStatus = user.animes && user.animes.find((o)=>{ return o.showId == this.show.showId; }) || false;
    $('subscriber-status').empty().template('subscriber-status', { subscriberStatus: this.subscriberStatus });
  }
}
