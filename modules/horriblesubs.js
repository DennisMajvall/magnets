var cheerio = require('cheerio');
var fs = require('fs');

const timeoutMs = 10000;
const timeoutIdsMs = timeoutMs * 2;
const timeoutMagnetsMs = timeoutMs * 3;
const httpOptions = {
	host: "horriblesubs.info",
	port: 80
};

function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = class HorribleSubs {

  constructor(){
		this.hasLoadedDb = false;
  }

	async loadDb() {
		if (!this.hasLoadedDb) {
			return MagnetsAnime.find({}).exec()
			.then((data)=> { this.magnetsAnime = data; })
			.then(() => {
				return ListAnime.find({}).exec()
				.then((data)=> { this.listAnime = data; })
			})
			.then(() => {
				this.hasLoadedDb = true;
			})
		}
		Promise.resolve('Success');
	}

  parseShowlist(input) {
    let $ = cheerio.load(input)
    input = $('.shows-wrapper > .ind-show.linkful > a');
    let result = [];

    input.each((i, el) => {
			let slug = el.attribs.href;
			let acceptableSlug = slug.match(/[^a-zA-Z0-9\/ -]/) == null;

			if (slug && slug[slug.length - 1] != '/') {
				slug += '/';
			}

			if (acceptableSlug) {
				result.push({
					'slug': slug,
					'title': el.attribs.title
				});
			}
    });

		function removeDuplicatesBy(keyFn, array) {
			let mySet = new Set();
			return array.filter(function(x) {
				let key = keyFn(x), isNew = !mySet.has(key);
				if (isNew) mySet.add(key);
				return isNew;
			});
		}

		result = removeDuplicatesBy(show => show.slug, result);
    return result;
  }

  parseShowlistId(input) {
		if (input.length < 100) return 0;
    let $ = cheerio.load(input)
    input = $('.entry-content > p > script');

		let numberId = parseInt(input.html().match(/\d+/)[0], 10);
    return isNaN(numberId) ? 0 : numberId;
  }

  parseMagnets(input, showId) {
		if (input.length < 100) return null;
    let $ = cheerio.load(input);
    input = $('.hs-magnet-link a');
    let result = {
			showId: showId,
			low: [],
			medium: [],
			high: []
		};

    input.each((i, el) => {
			let obj = {};

			let text = $(el).closest('.hs-magnet-link').prev('.dl-label').find('i').text();
			let quality = text.match(/\s*\[(\d*p)\]/)[1];

			obj.magnet = el.attribs.href;

			let matches = text.match(/-\s+(\d+\.?\d?)(\+)?(v\d?)?.*\[.*\]/);
			if (!matches) {
				console.log(showId, '_', text);
				matches = ['error', 999];
			}
			obj.episode = matches[1];

			let qualityIndex = 'low';
			if (quality == '720p') qualityIndex = 'medium'
			else if (quality == '1080p') qualityIndex = 'high';

			result[qualityIndex].push(obj);
    });

    return result;
  }

  saveShowlistToDb(showlist){
		return new Promise((resolve, reject) => {
			let countdown = showlist.length;

			for (let show of showlist) {
				let dbItem = new ListAnime(show);
				dbItem.save((err) => {
					if (--countdown == 0) resolve();
				});
			}
		});
  }

  downloadShowlistIds(){
    return new Promise((resolve, reject) => {
			let countdown = 0;

			let tryResolve = (err)=> {
				if (err) reject('downloadShowlistIds failed to save');
				if (--countdown == 0) {
					clearTimeout(timeoutHandle);
					resolve();
				}
			};

			ListAnime.find({}, (err, arrayShows) => {
				if (err) { console.log(err); return; }
				countdown = arrayShows.length;

				let httpCallback = (show, data) => {
					show.showId = this.parseShowlistId(data);
					show.showId ? show.save(tryResolve) : reject(show.slug + 'could not get ID');
				}

				for (let show of arrayShows) {
					if (show.showId) {
						tryResolve();
						continue;
					}

					let options = Object.assign({}, httpOptions, { path: show.slug });
					global.getHtml(
						(data) => httpCallback(show, data),
						options,
						()=>{
							tryResolve();
							console.log('countdown:', countdown, show.title);
						}
					);
				}
			});

      let timeoutHandle = setTimeout(() => {
        reject('timeout downloadShowlistIds, countdown: ' + countdown);
			}, timeoutIdsMs);

    });
  }

  downloadShowlist(){
    return new Promise((resolve, reject) => {
      let options = Object.assign({}, httpOptions, { path: "/shows/" });

      let doResolve = (data) => {
        clearTimeout(timeoutHandle);
        let showlist = this.parseShowlist(data);
        this.saveShowlistToDb(showlist).then(resolve, reject);
      }

      let timeoutHandle = setTimeout(() => {
        reject('timeout downloadShowlist');
      }, timeoutMs);

      global.getHtml(doResolve, options);
    });
  }

  async downloadMagnets(){
		return this.loadDb()
		.then(() => {

			let loadedIds = this.magnetsAnime.map(m => m.showId);

			return new Promise((resolve, reject) => {
				let countdown = 0;

				let tryResolve = (err, show)=> {
					if (!err)
							console.log('saved:', show.title, 'countdown', countdown);
					if (--countdown == 0) {
						clearTimeout(timeoutHandle);
						resolve();
					}
				};

				ListAnime.find({showId: { $gt: 0, $nin: loadedIds} }, (err, arrayShows) => {
					if (err) { console.log(err); return; }
					countdown = arrayShows.length;

					let httpCallback = (show, data) => {
						clearTimeout(timeoutHandle);
						let magnets = this.parseMagnets(data, show.showId);
						if (magnets) {
							new MagnetsAnime(magnets).save((err) => tryResolve(err, show));
						} else {
							tryResolve('done');
						}
					}
					if (!arrayShows.length) {
						resolve();
					}

					for (let show of arrayShows) {
						let options = Object.assign({}, httpOptions, {
							path: "/lib/getshows.php?type=show&nextid=0&showid=" + show.showId
						});
						global.getHtml((data) => httpCallback(show, data), options);
					}
				});

				let timeoutHandle = setTimeout(() => {
					reject('timeout downloadMagnets, countdown: ' + countdown);
				}, timeoutMagnetsMs);
			});
		});
  }

	parseRSS(input) {
    let $ = cheerio.load(input);
    input = $('item');

		let result = {};

    input.each((i, el) => {
			let magnet = $(el).find('link')[0].next.data;
			let titleText = $(el).find('title').text();

			let originalTitle = titleText;
			// Remove S2 etc after title, before episode
			titleText = titleText.replace(/(\]\s.*)( S\d+)+( - .*\[\d*p\])/, "$1$3");

			if (originalTitle != titleText) {
				ListAnime.find({title: extractTitle()}).exec()
				.then((something, b) => {
					// if: S2 was actually part of the anime's title, revert changes
					something && something.length && (titleText = originalTitle);
					continueExecution();
				}, (e)=>{ console.log('rejected:', e); });
			} else {
				continueExecution();
			}

			function extractTitle(){ return titleText.match(/\]\s*(.*) - .*\[\d*p\]/)[1]; }

			function continueExecution(){
				let title = extractTitle();
				let quality = titleText.match(/ - .*\[(\d*p)\]/)[1];

				let episode = titleText.match(/-\s+(\d+\.?\d?)(\+)?(v\d?)?.*\[\d*p\]/);
				if (!episode) { episode = ['error', 999]; }
				episode = parseInt(episode[1], 10);

				let qualityIndex = 'low';
				if (quality == '720p') qualityIndex = 'medium'
				else if (quality == '1080p') qualityIndex = 'high';

				if (!result.hasOwnProperty(title)) {
					result[title] = {
						low: [],
						medium: [],
						high: []
					};
				}

				result[title][qualityIndex].push({
					episode: episode,
					magnet: magnet
				});
			}
		});

    return result;
  }

	readRSS(){
		let pushNonDuplicateMagnets = (oldArr, newArr) => {
			for (let newMag of newArr){
				let exists = false;
				for (let mag of oldArr) { exists = exists || mag.episode == newMag.episode; }
				if (!exists) { oldArr.push(newMag); }
			}
		}

		let httpCallback = (data) => {
			let parsed = this.parseRSS(data);
			for (let showTitle in parsed){
				let newMagnets = parsed[showTitle];

				ListAnime.find({title: showTitle}).exec()
				.then((show) => {
					if (show && show.length) {
						show = show[0];
						newMagnets.showId = show.showId;
						return MagnetsAnime.find({showId: show.showId}).exec();
					}
				})
				.then((magnet) => {
					if (magnet == undefined) return;

					if (magnet.length) {
						magnet = magnet[0];
						pushNonDuplicateMagnets(magnet.low, newMagnets.low);
						pushNonDuplicateMagnets(magnet.medium, newMagnets.medium);
						pushNonDuplicateMagnets(magnet.high, newMagnets.high);
						magnet.save((err, savedItem, numAffected) => {
							numAffected && (console.log('RSS updated:', showTitle, 'id:', newMagnets.showId));
						});
					} else {
						new MagnetsAnime(newMagnets).save();
						console.log('RSS added a new showId', newMagnets.showId);
					}
				});
			}
		}

		let options = Object.assign({}, httpOptions, { path: "/rss.php?res=all" });
		global.getHtml((data) => httpCallback(data), options);
	}
}
