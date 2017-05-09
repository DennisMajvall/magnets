class IndexPage {
	constructor() {
		Rest.ListAnime.find('', (shows) => {
			shows = shows.map(s => {
				s.slug = s.slug.replace('/shows/', '/anime/');
				return s;
			});

			$('.page-content').template('index-page', { shows: shows });
		});
	}
}
