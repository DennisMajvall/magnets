const cheerio = require('cheerio');
const scraperjs = require ('scraperjs');

const timeoutMs = 10000;
const timeoutIdsMs = timeoutMs * 2;
const timeoutMagnetsMs = timeoutMs * 3;
const website = 'http://horriblesubs.info';

function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = class HorribleSubs {

  constructor(){
    this.nonExistantAnimes = [];
  }

  async downloadUrl(url){
    let scraper = scraperjs.StaticScraper.create(url);
    let html = await scraper.scrape(($)=>{ return $.html(); });
    return html;
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
    input = $('.entry-content > p > script[type="text/javascript"]');
    input = input.html() || '';
    input = input.match(/\d+/) || []

    return parseInt(input[0], 10) || 0;
  }

  parseShowlistDescription(input) {
    if (input.length < 100) return null;
    let $ = cheerio.load(input)
    return $('.entry-content .series-desc').text();
  }

  parseShowlistThumbnail(input) {
    if (input.length < 100) return null;
    let $ = cheerio.load(input)
    let imgSrc = $('.entry-content .series-image img').attr('src') || '';
    return 'https://' + imgSrc.replace(/https?:\/\//g, '');
  }

  parseMagnetBatch(input, show){
    return new Promise((resolve) => {
      let httpCallback = (show, data) => {
        clearTimeout(timeoutHandle);
        resolve(data);
      }

      let options = Object.assign({}, httpOptions, {
        path: "/lib/getshows.php?type=batch&showid=" + show.showId
      });
      global.getHtml((data) => httpCallback(show, data), options);

      let timeoutHandle = setTimeout(() => {
        console.log('timeout parseMagnetBatch');
        resolve(null);
      }, timeoutMs);
    });
  }

  async parseMagnets(input, show) {
    if (input.length < 100 || input == 'DONE') {
      input = await this.parseMagnetBatch(input, show);
      if (input.length < 100) return null;
    }
    let $ = cheerio.load(input);
    input = $('.hs-magnet-link a');
    let result = {
      showId: show.showId,
      low: [],
      medium: [],
      high: []
    };

    input.each((i, el) => {
      let obj = {};

      let text = $(el).closest('.hs-magnet-link').prev('.dl-label').find('i').text();
      let quality = text.match(/\s*\[(\d*p)\]/)[1];

      obj.magnet = el.attribs.href;
      // obj.magnet = obj.magnet.split('&tr=')[0];
      // obj.magnet = obj.magnet.substr(obj.magnet.lastIndexOf(':')+1);
      // obj.magnet += el.attribs.href.split('&tr=')[1]; // add trackers.

      let matches = text.match(/-\s+(\d+\.?\d?)(\+)?(v\d?)?.*\[.*\]/);
      if (!matches) {
        matches = text.match(/(\(\d+-(\d+)\)).*\[.*\]/);
        if (!matches) {
          console.log(show.showId, '_', text);
          matches = ['error', 999];
        } else {
          console.log('bulk', text);
          matches = ['bulk', matches[2]]; // [2] = highest in bulk
        }
      }
      obj.episode = matches[1];

      let qualityIndex = 'low';
      if (quality == '720p') qualityIndex = 'medium'
      else if (quality == '1080p') qualityIndex = 'high';

      result[qualityIndex].push(obj);
    });

    if (result.high.length + result.medium.length + result.low.length > 0)
      return result;
    return null;
  }

  async saveShowlistToDb(showlist){
    let oldShowList = (await ListAnime.find({})).map(a => a.title);
    showlist = showlist.filter(s => oldShowList.indexOf(s.title) == -1);

    for (let show of showlist) {
      await new ListAnime(show).save((err) => {
        err && console.log('saveShowlistToDb failed to save', show.title + '.', err);
        !err && console.log('saved new show:', show.title);
      });
    }
  }

  async downloadShowlistIds(){
    let arrayShows = await ListAnime.find({showId: {$exists: false}});

    async function downloadShowId(show){
      let html = await this.downloadUrl(website + show.slug);
      show.showId = this.parseShowlistId(html);
      show.showId && console.log('Saved showId', show.showId);
      show.showId && (await show.save());
      !show.showId && console.log(show.slug, 'could not get showID');
    }

    let arrayPromises = [];
    for (let show of arrayShows) {
      arrayPromises.push(downloadShowId.call(this, show));
      await sleep(100);
    }

    await Promise.all(arrayPromises);
  }

  async downloadShowlist(){
    let html = await this.downloadUrl(website + '/shows/');
    let showlist = this.parseShowlist(html);
    await this.saveShowlistToDb(showlist);
  }

  async downloadMagnetsOfShow(show){
    let pagination = 0;
    let html = 'not done';
    // console.log('downloading show:', show.title || show.showId);

    while (html != 'DONE') {
      html = await this.downloadUrl(website + "/lib/getshows.php?type=show&nextid=" + pagination + "&showid=" + show.showId);
      pagination && (!html || html == 'DONE') && console.log('no html for show:', show.title || show.showId, 'page:', pagination);
      if (!html || html == 'DONE') { break; }

      let magnets = await this.parseMagnets(html, show);
      if (magnets) {
        let saveResult = await (new MagnetsAnime(magnets)).save()
          .catch(e=>console.log('could not save:', show.title, e.message))
          .then(()=>console.log('saved:', show.title));
      }

      // limit: 5000 episodes.
      if (++pagination > 10) { break; }
    }
    return true;
  }

  async downloadMagnets(){
    let loadedIds = (await MagnetsAnime.find({})).map(m => m.showId);
    let arrayShows = await ListAnime.find({showId: { $gt: 0, $nin: loadedIds} });

    let arrayPromises = [];
    for (let show of arrayShows) {
      arrayPromises.push(this.downloadMagnetsOfShow.call(this, show));
      await sleep(100);
    }

    await Promise.all(arrayPromises);
  }

  async parseRSS(input) {
    let $ = cheerio.load(input);
    input = $('item');

    let result = {};

    async function onIteration(i, el){
      let magnet = $(el).find('link')[0].next.data;
      let fullTitle = $(el).find('title').text();

      let regexParts = fullTitle.match(/\]\s(.*[^S\d])(S*\d*)( - |[\s]+\(\d*-)(\d+)+.*\[(\d*p)\]/);
      if (!regexParts) {
        console.log('RSS could not regex: ', fullTitle);
        return;
      }
      regexParts = regexParts.map((s) => {return (s||'').trim()});
      let title = regexParts[1]; // Ex 'Shingeki No Kyojin'
      let season = regexParts[2]; // Ex: 'S2' or '2' or ''
      // part 3 is just the spaces/dashes between 2 and 4
      let episode = regexParts[4]; // Ex '37'
      let quality = regexParts[5]; // Ex '1080p'

      let titleWithSeason = title + ' ' + season;

      if (season) {
        let something = await ListAnime.find({title: titleWithSeason}).exec()
        .catch((e) =>{ console.log('rejected:', e); });
        if (something && something.length) {
          title = titleWithSeason;
        }
      }

      if (!result.hasOwnProperty(title)) {
        result[title] = {
          low: [],
          medium: [],
          high: []
        };
      }

      let qualityIndex = 'low';
      if (quality == '720p') qualityIndex = 'medium'
      else if (quality == '1080p') qualityIndex = 'high';

      let rawMagnetName = magnet;//.split('&tr=')[0];
      // rawMagnetName = rawMagnetName.substr(rawMagnetName.lastIndexOf(':')+1);
      // rawMagnetName += magnet.split('&tr=')[1]; // add trackers.

      result[title][qualityIndex].push({
        episode: parseInt(episode, 10),
        magnet: rawMagnetName
      });
    }

    for(let i = 0; i < input.length; ++i){
      let el = input[i];
      await onIteration(i, el);
    }

    return result;
  }

  async readRSS(){
    let html = await this.downloadUrl(website + "/rss.php?res=all");
    let parsed = await this.parseRSS(html);

    let pushNonDuplicateMagnets = (oldArr, newArr) => {
      for (let newMag of newArr){
        let exists = false;
        for (let mag of oldArr) { exists = exists || mag.episode == newMag.episode; }
        if (!exists) { oldArr.push(newMag); }
      }
    }

    for (let showTitle in parsed){
      let newMagnets = parsed[showTitle];
      let magnet;
      let show = await ListAnime.find({title: showTitle}).exec();

      if (show && show.length) {
        show = show[0];
        newMagnets.showId = show.showId;
        magnet = await MagnetsAnime.find({showId: show.showId}).exec();
      } else if (this.nonExistantAnimes.indexOf(showTitle) == -1){
        this.nonExistantAnimes.push(showTitle)
        console.log('RSS received magnet that\'s not in listanimes:', showTitle);
      }

      if (magnet == undefined) return;

      if (magnet.length) {
        magnet = magnet[0];
        pushNonDuplicateMagnets(magnet.low, newMagnets.low);
        pushNonDuplicateMagnets(magnet.medium, newMagnets.medium);
        pushNonDuplicateMagnets(magnet.high, newMagnets.high);

        await (async ()=>{
          magnet.save((err, savedItem, numAffected) => {
            numAffected && console.log('RSS updated:', showTitle, 'id:', newMagnets.showId);
            err && console.log('RSS magnet.save failed:', err);
            return true;
          })
        })();

      } else {
        await (new MagnetsAnime(newMagnets)).save();
        console.log('RSS added a new showId', newMagnets.showId);
      }
    }
  }

  async downloadContentOfShow(show){
    let data = await this.downloadUrl(website + show.slug);

    show.description = this.parseShowlistDescription(data);
    show.image = this.parseShowlistThumbnail(data);
    if (show.description && show.image) {
      await show.save()
        .catch(e=>console.log(show.slug + 'could not get Content.', e));
        console.log('saved content of', show.slug);
    } else {
      console.log('could not get description and img from:', show.slug);
    }
  }

  async downloadShowlistContent(){
    let arrayShows = await ListAnime.find({"description": {"$exists": false}});

    let arrayPromises = [];
    for (let show of arrayShows) {
      arrayPromises.push(this.downloadContentOfShow.call(this, show));
      await sleep(100);
    }

    await Promise.all(arrayPromises);
  }
}

