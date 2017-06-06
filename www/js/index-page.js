class IndexPage {
	constructor() {
		this.shows = [];
		Rest.ListAnime.find('', (shows) => {
			shows = shows.map(s => {
				s.slug = s.slug.replace('/shows/', '/anime/');
				return s;
			});
			this.shows = shows;

			if (!user)
				WATCH('login', this.onLogin, this);
			else
				this.onLogin();
		});
	}

	onLogin(){
		$('.page-content').empty().template('index-page', { shows: this.shows });
		let el = $('#magnet-links');
		if (!el.length) return;

		function getShows(magnets){
			if (!magnets || !magnets.length) return;

			for (let i = 0; i < magnets.length; ++i){
				let name = 'magnetframe' + i;
				let iFrame = `<iframe style="display:none" name="${name}"></iframe>`
				el.append(iFrame);
				window.open(magnets[i], `${name}`);
			}
		}
		$.ajax({
			url: '/get-shows',
			beforeSend: function(xhr) {
				if (xhr.overrideMimeType)
					xhr.overrideMimeType("application/json");
			},
			type: "GET",
			dataType: "json",
			success: getShows,
			error: function(error){
				console.log(error.responseJSON);
			}
		});
	}
}
