class AnimeList {
  constructor() {
    Rest.ListAnime.find('', (shows) => {
      shows = shows.map(s => {
        s.slug = s.slug.replace('/shows/', '/anime/');
        return s;
      });

      $('.anime-list').empty().template('anime-list', { shows: shows });
      $('#searchInput').off().on('keyup', (e)=>{ this.onKeyUp($(e.target));});

      this.aTags = {};
      let me = this;
      $('#search-list').find('a').each(function(){
        me.aTags[$(this).text().toLowerCase()] = $(this);
      });
    });
  }

  onKeyUp(el){
    let s = el.val().toLowerCase();
    for(let key in this.aTags){
      if (key.indexOf(s) != -1)
        this.aTags[key].removeClass('hidden');
      else
        this.aTags[key].addClass('hidden');
    }
  }
}
