class Router {
	constructor() {
    if (!routes) throw new Error('No routes setup before Router.constructor!');

		$(document).on('click','a', (e) => {
			this.clickHandler($(e.currentTarget), e);
		});

		// when using back/forward buttons call actOnRoute
		window.onpopstate = () => {
			this.actOnRoute(location.pathname);
		}

		// on initial load
		this.actOnRoute(location.pathname);
	}

	clickHandler(aTag, e) {
    if(aTag.attr('target') == '_blank') { console.log('wtf'); return; }
		var href = aTag.attr('href');

		let route = Router.getFunctionFromHref(href);

		if(!route) {
			console.log('route not found in clickHandler', href);
			return;
		}

		// use pushState (change url + add to history)
		// (the two first arguments are meaningless but required)
		history.pushState(null, '', href);

		e.preventDefault();
		this.actOnRoute(route);
	}

	actOnRoute(route) {
		var func = route;
		if (typeof func == 'string')
			func = Router.getFunctionFromHref(func);

		if (!func) {
			func = routes['/']
			console.log('route not found', route);
		}

		if (func) {
			$('.middle-part').off().empty();
			func();
		}
	}

	static getFunctionFromHref(href){
    return routes[ Router.getRouteFromUrl(href) ];
	}

  // '/anime/some-name-here' returns '/anime/*'
	static getRouteFromUrl(href = location.pathname){
    if (routes[href]) return href;

    for (let r in routes){
      let i = r.indexOf('*');

      if (i > -1 && href.substr(0, i) === r.substr(0, i)) {
        return r;
      }
    }
		return '';
	}
}
