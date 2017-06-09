class GetShows {
	constructor() {
		WATCH('login', this.onLogin, this);
	}

	onLogin(){
		let el = $('.get-shows');
		if (!el.length) return;

		$.ajax({
			url: '/get-shows',
			beforeSend: function(xhr) {
				if (xhr.overrideMimeType)
					xhr.overrideMimeType("application/json");
			},
			type: "GET",
			dataType: "json",
			success: this.createMagnetLinks,
			error: function(error){
				console.log(error.responseJSON);
			}
		});
	}

	createMagnetLinks(magnets){
		if (!magnets || !magnets.length) return;
		let el = $('.get-shows');

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
