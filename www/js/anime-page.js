class AnimePage {
	constructor() {

		let param = location.pathname;
		if (param && param[param.length - 1] != '/') { param += '/'; }
		param = param.replace('/anime/', '/shows/');

		Rest.ListAnime.find(`find/{ slug: "${param}" }`, (shows) => {
			for (let show of shows) {
				this.show = show;

				let subscriberStatus = user.animes.find((o)=>{ return o.showId == show.showId;});

				$('.page-content').template('anime-page', {
					show: show,
					subscriberStatus: subscriberStatus
				});

				$('#update').on('click', (e)=>{this.updateEpisode(e)});
				$('#subscribe').on('click', (e)=>{this.subscribe(e)});
				$('#unsubscribe').on('click', (e)=>{this.unsubscribe(e)});

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
		let showIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
		if (showIndex == -1) return;

		let episode = $('#last-seen-episode').val() / 1;
		user.animes[showIndex].episode = episode;
		this.updateSubscribeStatus();
	}

	subscribe(e){
		user.animes.push({showId: this.show.showId, episode: 0 });
		this.updateSubscribeStatus();
	}

	unsubscribe(e){
		let episodeIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
		if (episodeIndex == -1) return;

		user.animes.splice(episodeIndex, 1);
		this.updateSubscribeStatus();
	}

	updateSubscribeStatus(){
		if (this.startedUpdating) return;
		this.startedUpdating = true;

		Rest.User.update(user._id, { animes: user.animes },()=>{
			Rest.Login.update('', {}, () => {
				location.reload();
			});
		});
	}
}
