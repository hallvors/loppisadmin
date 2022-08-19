import {doneStates, SIZE_BIG, SIZE_MEDIUM, SIZE_SMALL} from '../config';

export function getIdFromUrl(url) {
	return url
		.split(/\//g)
		.splice(-2)
		.join("/");
}

// SMSapi uses the national 47 prefix but w/o +, we typically want to
// strip that out. I remove whitespace just in case we use this method
// on input form non-SMSapi sources..
export function normalizeNumber(str) {
	return str.replace(/\s*/g, "").substr(-8);
}

export function filter(
	string,
	sizePref,
	dayPref,
	typeFilter,
	qualityFilter,
	hideDoneJobs,
	fetchers,
	job,
	cols
) {
	if (hideDoneJobs && doneStates.indexOf(job[cols.STATUS]) > -1) {
		return false;
	}
	// all the "defaults" set - noop
	if (
		sizePref.smallActive &&
		sizePref.mediumActive &&
		sizePref.bigActive &&
		dayPref.monActive &&
		dayPref.tueActive &&
		dayPref.wedActive &&
		dayPref.thuActive &&
		!dayPref.dayFilterExclusive &&
		!string &&
		!typeFilter &&
		qualityFilter === ''
	) {
		return true;
	}

	if (job[cols.SIZE] === SIZE_BIG && !sizePref.bigActive) {
		return false;
	}
	if (job[cols.SIZE] === SIZE_MEDIUM && !sizePref.mediumActive) {
		return false;
	}

	if (job[cols.SIZE] === SIZE_SMALL && !sizePref.smallActive) {
		return false;
	}

	if (typeFilter && job[cols.TYPES].indexOf(typeFilter) === -1) {
		return false;
	}

	if (qualityFilter !== '' && job[cols.QUALITY] !== qualityFilter) {
		return false;
	}

	let showDay = [
		//{prop: dayPref.monActive, str: 'Mandag'},
		{ prop: dayPref.tueActive, str: "Tirsdag" },
		{ prop: dayPref.wedActive, str: "Onsdag" },
		{ prop: dayPref.thuActive, str: "Torsdag" },
	].map((item) => {
		if (dayPref.dayFilterExclusive) {
			return (
				job[cols.PICKUP_DAYS].indexOf(item.str) >
					-1 ===
				item.prop
			);
		}
		return (
			item.prop &&
			job[cols.PICKUP_DAYS].indexOf(item.str) > -1
		);
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
	if (job[cols.ASSIGNEE] && fetchers && fetchers.length && string) {
		if (
			fetchers.find(
				(person) =>
					person.name.toLowerCase().indexOf(string.toLowerCase()) > -1
			)
		) {
			return true;
		}
	}

	return (
		[
			cols.ADDRESS,
			cols.TYPES,
			cols.CONTACT_PERSON,
			cols.PHONE,
			cols.DESC,
			cols.AREA,
			cols.STATUS,
			cols.ADMCOMMENT,
			cols.ASSIGNEE,
		]
			.map((key) => {
				return (
					(job[key] || "")
						.toLowerCase()
						.indexOf(string.toLowerCase()) > -1
				);
			})
			.indexOf(true) > -1
	);
}
