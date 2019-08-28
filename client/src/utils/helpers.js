export function getIdFromUrl(url) {
	return url.split(/\//g)
		.splice(-2)
		.join('/');
}

// SMSapi uses the national 47 prefix but w/o +, we typically want to
// strip that out. I remove whitespace just in case we use this method
// on input form non-SMSapi sources..
export function normalizeNumber(str) {
	return str.replace(/\s*/g, '').substr(-8);
}

export function filter(string, sizePref, dayPref, typeFilter, hideDoneJobs, fetchers, job) {
	if (hideDoneJobs && ['Hentet', 'Hentes ikke'].indexOf(job.status) > -1) {
		return false;
	}
	// all the "defaults" set - noop
	if (sizePref.smallActive && sizePref.bigActive &&
		dayPref.monActive && dayPref.tueActive && dayPref.wedActive &&
		dayPref.thuActive && !dayPref.dayFilterExclusive && !string &&
		!typeFilter)
	{
		return true;
	}

	if (!sizePref.bigActive && job['størrelse']) {
		return false;
	}
	if (!sizePref.smallActive && !job['størrelse']) {
		return false;
	}

	if (typeFilter && job['typerlopper'].indexOf(typeFilter) === -1) {
		return false;
	}

	let showDay = [
		//{prop: dayPref.monActive, str: 'Mandag'},
		{prop: dayPref.tueActive, str: 'Tirsdag'},
		{prop: dayPref.wedActive, str: 'Onsdag'},
		{prop: dayPref.thuActive, str: 'Torsdag'}
	]
	.map(item => {
		if (dayPref.dayFilterExclusive) {
			return job['hentetidspunktkryssavsåmangedukan'].indexOf(item.str) > -1 === item.prop;
		}
		return item.prop && job['hentetidspunktkryssavsåmangedukan'].indexOf(item.str) > -1
	});
	if (dayPref.dayFilterExclusive) {
		// all must be true
		showDay = showDay.reduce((tot, now) => tot && now, true);
	} else {
		showDay = showDay.indexOf(true) > -1;
	}
	if (!showDay) {
		return false;
	}
	if (job.hentesav && fetchers && fetchers.length && string) {
		if (fetchers.find(person => person.name.toLowerCase().indexOf(string.toLowerCase()) > -1)) {
			return true;
		}
	}

	return [
		'adresseforhenting',
		'typerlopper',
		'navnpåkontaktperson',
		'telefonnummer',
		'informasjonomloppene',
		'status',
		'admkom',
		'hentesav',
	].map(key => {
		return (job[key] || '').toLowerCase().indexOf(string.toLowerCase()) > -1
	})
	.indexOf(true) > -1;
}
