class GetShows {
  constructor() {
    this.startDownload();
    WATCH('get-shows', this.startDownload, this);
  }

  startDownload(){
    if (this.inProgress) return;
    this.inProgress = true;

    $.ajax({
      url: '/get-shows',
      beforeSend: function(xhr) {
        if (xhr.overrideMimeType)
          xhr.overrideMimeType("application/json");
      },
      type: "GET",
      dataType: "json",
      success: (data)=>{ this.onShowsDownloaded(data) },
      error: (error)=>{
        this.inProgress = false;
        console.log(error.responseJSON);
      }
    });
  }

  onShowsDownloaded(magnets){
    if (!magnets || !magnets.length){
      this.inProgress = false;
      return;
    }

    Rest.Trackers.find('find/{isAnime: true}', (trackers) => {
      if (trackers && trackers.length){
        let trackersAsString = '&tr=' + trackers.map(t=>t.name).join('&tr=');
        this.createMagnetLinks(magnets, trackersAsString);
      } else {
        console.log('no trackers found');
      }

      this.inProgress = false;
    });
  }

  createMagnetLinks(magnets, trackersAsString){
    let el = $('body');

    for (let i = 0; i < magnets.length; ++i){
      let name = 'magnetframe' + i;
      let iFrame = `<iframe style="display:none" name="${name}"></iframe>`
      el.append(iFrame);

      let magnetAsLink = 'magnet:?xt=urn:btih:' + magnets[i] + trackersAsString;
      window.open(magnetAsLink, `${name}`);
    }

    Rest.Login.update((res) => {
      user = res.user;
      BROADCAST('shows-downloaded');
    });
  }
}
