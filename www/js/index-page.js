class IndexPage {
	constructor() {

		let model = {
			"text": "The index page!"
		}

		$('body').empty().template('index-page', model);

		// var magnet = "magnet:?xt=urn:btih:GQDND2BZEH65B6S2CWGLCLRI44JZ2VS5&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.internetwarriors.net:1337/announce&tr=udp://tracker.leechers-paradise.org:6969/announce&tr=http://tracker.internetwarriors.net:1337/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=http://tracker.opentrackr.org:1337/announce&tr=udp://tracker.zer0day.to:1337/announce&tr=udp://tracker.pirateparty.gr:6969/announce&tr=http://explodie.org:6969/announce&tr=http://p4p.arenabg.com:1337/announce&tr=http://mgtracker.org:6969/announce";
		// window.open(magnet, 'magnetframe');
	}
}
