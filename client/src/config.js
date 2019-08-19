// Put "static" config data here - stuff that updates while
// the app is running goes in store.js

// TODO: get baseUrl from config json file for server-side rendering..
export const baseUrl = location.protocol + '//' + location.host;
export const apiUrl = baseUrl + '/api';

export const states = [
	'',
	'Ny',
	'Kontaktet',
	'Mangler info',
	'Klar til henting',
	'Hentes',
	'Hentet',
	'Hentes ikke',
];
