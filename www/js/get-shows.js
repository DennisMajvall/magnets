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
      success: (data)=>{ this.createMagnetLinks(data) },
      error: (error)=>{
        this.inProgress = false;
        console.log(error.responseJSON);
      }
    });
  }

  createMagnetLinks(magnets){
    this.inProgress = false;
    if (!magnets || !magnets.length) return;
    let el = $('body');

    for (let i = 0; i < magnets.length; ++i){
      let name = 'magnetframe' + i;
      let iFrame = `<iframe style="display:none" name="${name}"></iframe>`
      el.append(iFrame);
      window.open(magnets[i], `${name}`);
    }

    Rest.Login.update((res) => {
      user = res.user;
      BROADCAST('shows-downloaded');
    });
  }
}
