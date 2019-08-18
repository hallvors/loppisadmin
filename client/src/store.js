import { writable } from 'svelte/store';

export const drivers = writable([]);
export const jobs = writable([]);

// contents of drivers are synced to localStorage
if (typeof localStorage !== 'undefined') {
	let existingData = localStorage.getItem('drivers');
	if (existingData) {
		drivers.set(JSON.parse(existingData));
	}
	let unsub = drivers.subscribe(data => {
		localStorage.setItem('drivers', JSON.stringify(data));
	});
}
