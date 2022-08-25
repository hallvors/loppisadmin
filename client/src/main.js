import App from './App.svelte';
import ShowSingleJob from './ShowSingleJob.svelte';

var app;
// basic "routing" for load-once-never-leave pages
if (typeof location !== 'undefined') {
	let chosen = {
		'/': App,
		'/henting/': ShowSingleJob
	}[location.pathname];
	app = new chosen({
		target: document.body,
		props: {
			googleMapsLoaded: false
		}
	});
} else {
	app = new App({
		target: document.body,
		props: {
			googleMapsLoaded: false
		}
	});
}

window.initGMaps = function ready() {
	app.$set({ googleMapsLoaded: true });
}

export default app;
