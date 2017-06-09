class Router {
	constructor() {
		var self = this;
		routes = routes || {};

		$(document).on('click','a', function(e) {
			self.clickHandler($(this), e);
		});

		// when using back/forward buttons call actOnRoute
		window.onpopstate = () => {
			self.actOnRoute(location.pathname);
		}

		// on initial load
		self.actOnRoute(location.pathname);
	}

	clickHandler(aTag, e) {
		var href = aTag.attr('href'), handleThisRoute = false;

		let route = this.getFunctionFromHref(href);

		if(!route) {
			return;
		}

		// use pushState (change url + add to history)
		// (the two first arguments are meaningless but required)
		history.pushState(null, '', href);

		e.preventDefault();
		this.actOnRoute(route);
	}

	getFunctionFromHref(href){
		var func = routes[href];

		if (!func) {
			for (let r in routes){
				let i = r.indexOf('*');

				if (i > -1 && href.substr(0, i) === r.substr(0, i)) {
					func = routes[r];
					break;
				}
			}
		}
		return func;
	}

	actOnRoute(route) {
		var func = route;
		if (typeof func == 'string')
			func = this.getFunctionFromHref(func);

		if (!func) {
			func = routes['/']
			console.log('route not found', route);
		}

		if (func) {
			$('.middle-part').empty().off();
			func();
		}
	}
}
