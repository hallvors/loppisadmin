export function getIdFromUrl(url) {
	return url.split(/\//g)
		.splice(-2)
		.join('/');
}

export function filter(string, sizePref, dayPref, typeFilter, hideDoneJobs, job) {
	if (hideDoneJobs && ['Hentet', 'Avvist'].indexOf(job.status) > -1) {
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

	return [
		'adresseforhenting',
		'typerlopper',
		'navnpåkontaktperson',
		'telefonnummer',
		'informasjonomloppene',
		'status',
	].map(key => job[key].indexOf(string) > -1)
	.indexOf(true) > -1;
}