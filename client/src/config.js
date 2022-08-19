// Put "static" config data here - stuff that updates while
// the app is running goes in store.js

// TODO: get baseUrl from config json file for server-side rendering..
export const baseUrl = location.protocol + '//' + location.host;
export const apiUrl = baseUrl + '/api';

export const gMapsDirection = 'https://www.google.com/maps/dir//';

export const states = [
	'',
	'Ny',
	'Kontaktet',
	'Mangler info',
	'Klar til henting',
	'Sendt til henter',
	'Hentes',
	'Hentet',
	'Hentes ikke',
	'Utsettes - neste gang',
];

export const doneStates = [
	'Hentet',
	'Hentes ikke',
	'Utsettes - neste gang',
	];

export const SIZE_BIG = 'Trenger varebil';
export const SIZE_MEDIUM = 'Kan hentes med stasjonsvogn';
export const SIZE_SMALL = '1-3 kasser';
