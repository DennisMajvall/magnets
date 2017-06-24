class AnimeDetails {
  constructor() {
    let param = location.pathname;
    if (param && param[param.length - 1] != '/') { param += '/'; }
    param = param.replace('/anime/', '/shows/');

    Rest.ListAnime.find(`find/{ slug: "${param}" }`, (shows) => {
      for (let show of shows) {
        this.show = show;

        $('.middle-part').template('anime-details', { show: this.show });

        WATCH('shows-downloaded', this.renderSubscriberTemplate, this);
        WATCH('login', this.renderSubscriberTemplate, this);
        WATCH('logout', this.renderSubscriberTemplate, this);
        this.renderSubscriberTemplate();

        this.loadMagnets();
      }
    });
  }

  loadMagnets(){
    Rest.MagnetsAnime.find(`find/{ showId: ${this.show.showId} }`, (magnets) => {
      for (let magnet of magnets) {
        Rest.Trackers.find('find/{isAnime: true}', (trackers) => {
          if (trackers && trackers.length){
            let trackersAsString = '&tr=' + trackers.map(t=>t.name).join('&tr=');

            function convertToLink(m) { m.magnet ='magnet:?xt=urn:btih:'+m.magnet+trackersAsString;}
            function sortEp(a,b) { return a.episode < b.episode ? 1 : -1; }

            magnet.low.sort(sortEp).map(convertToLink);
            magnet.medium.sort(sortEp).map(convertToLink);
            magnet.high.sort(sortEp).map(convertToLink);

            $('magnets').template('magnets', magnet);
          }
        })
      }
    });
  }

  updateEpisode(){
    if (!user) return;
    let showIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
    if (showIndex == -1) return;

    let episode = $('#last-seen-episode').val() / 1;
    user.animes[showIndex].episode = episode;
    this.updateSubscribeStatus(true);
  }

  subscribe(){
    if (!user) return;
    user.animes.push({showId: this.show.showId, episode: 0 });
    this.updateSubscribeStatus();
  }

  unsubscribe(){
    if (!user) return;
    let showIndex = user.animes.findIndex((o)=>{ return o.showId == this.show.showId; });
    if (showIndex == -1) return;

    user.animes.splice(showIndex, 1);
    this.updateSubscribeStatus();
  }

  updateSubscribeStatus(getShows = false){
    if (this.startedUpdating) return;
    this.startedUpdating = true;

    Rest.User.update(user._id, { animes: user.animes },()=>{
      Rest.Login.update((res) => {
        user = res.user;
        this.startedUpdating = false;
        if (getShows)
          BROADCAST('get-shows');
        else
          this.renderSubscriberTemplate();
      });
    });
  }

  renderSubscriberTemplate(){
    if (Router.getRouteFromUrl() != '/anime/*') return;
    this.subscriberStatus = user.animes && user.animes.find((o)=>{ return o.showId == this.show.showId; }) || false;
    $('subscriber-status').off().empty().template('subscriber-status', { subscriberStatus: this.subscriberStatus });
    $('subscriber-status').on('click', '#update', ()=>{this.updateEpisode()});
    $('subscriber-status').on('click', '#subscribe', ()=>{this.subscribe()});
    $('subscriber-status').on('click', '#unsubscribe', ()=>{this.unsubscribe()});
  }
}
