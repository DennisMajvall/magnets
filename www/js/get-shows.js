class GetShows {
  constructor() {
    this.startDownload();
    WATCH('get-shows', this.startDownload, this);
  }

  startDownload() {
    if (this.inProgress) return;
    this.inProgress = true;

    $.ajax({
      url: '/get-shows',
      beforeSend: function (xhr) {
        if (xhr.overrideMimeType)
          xhr.overrideMimeType("application/json");
      },
      type: "GET",
      dataType: "json",
      success: (data) => { this.onShowsDownloaded(data) },
      error: (error) => {
        this.inProgress = false;
        console.log(error.responseJSON);
      }
    });
  }

  onShowsDownloaded(magnets) {
    if (!magnets || !magnets.length) {
      this.inProgress = false;
      return;
    }

    Rest.Trackers.find('find/{isAnime: true}', async (trackers) => {
      if (trackers && trackers.length) {
        let trackersAsString = '&tr=' + trackers.map(t => t.name).join('&tr=');
        await this.createMagnetLinks(magnets, trackersAsString);
      } else {
        console.log('no trackers found');
      }

      this.inProgress = false;
    });
  }

  async createMagnetLinks(magnets, trackersAsString) {
    let el = $('body');
    let w = window.open('/', '_blank');

    function sleep(ms = 0) {
      return new Promise(r => setTimeout(r, ms));
    }

    for (let i = 0; i < magnets.length; ++i) {
      let magnetAsLink = magnets[i].split('&tr=')[0];
      magnetAsLink = magnetAsLink.substr(magnetAsLink.lastIndexOf(':') + 1);
      magnetAsLink = 'magnet:?xt=urn:btih:' + magnetAsLink + trackersAsString;
      w = w.open(magnetAsLink, '_self');
      await sleep(1000);
    }

    Rest.Login.update((res) => {
      user = res.user;
      BROADCAST('shows-downloaded');
    });
  }
}
