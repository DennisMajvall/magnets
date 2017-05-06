var cheerio = require('cheerio');
var fs = require('fs');

let timeoutMs = 10000;
let httpOptions = { host: "horriblesubs.info", port: 80, path: "/shows/" };

module.exports = class HorribleSubs {

  constructor(){
    this.showList = [];
  }

  parseShowList(input) {
    let raw_html = input;//this.cleanUpHtml(input);
    let $ = cheerio.load(raw_html)
    raw_html = $('.shows-wrapper > .ind-show.linkful > a');

    let result = [];
    raw_html.each((i, el) => {
      result.push({
        'slug': el.attribs.href,
        'title': el.attribs.title
      });
    });

    return result;
  }

  saveShowListToDb(){
    let countdown = this.showList.length;

    ListAnime.remove({}, () => {
      for (let show of this.showList) {
        var dbItem = new ListAnime(show);
        dbItem.save();
      }
    });
  }

  downloadShowList(){
    return new Promise((resolve, reject) => {
      var options = Object.assign({}, httpOptions, { path: "/shows/" });

      let doResolve = (data) => {
        clearTimeout(timeoutHandle);
        this.showList = this.parseShowList(data);
        this.saveShowListToDb();
        resolve();
      }

      let timeoutHandle = setTimeout(() => {
        reject('timeout downloadShowList');
      }, timeoutMs);

      global.getHtml(doResolve, options);
    });
  }

  // cleanUpHtml(input) {
  //   return input.replace(/\\(t|n|r)/, '').replace('\"', '"');
  // }
}
