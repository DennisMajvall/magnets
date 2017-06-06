class AnimeList {
	constructor() {
		Rest.ListAnime.find('', (shows) => {
			shows = shows.map(s => {
				s.slug = s.slug.replace('/shows/', '/anime/');
				return s;
			});

			$('.anime-list').empty().template('anime-list', { shows: shows });
		});
	}
}
