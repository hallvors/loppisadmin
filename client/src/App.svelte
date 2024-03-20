<script>
	import {apiUrl, baseUrl, gMapsDirection} from './config.js';
	import RenderJob from './components/RenderJob.svelte';
	import Modal from './components/Modal.svelte';
	import SMSEditor from './components/SMSEditor.svelte';
	import DriverEditor from './components/DriverEditor.svelte';
	import StateEditor from './components/StateEditor.svelte';
	import FlashMessage from './components/FlashMessage.svelte';
	import LoadingIcon from './components/LoadingIcon.svelte';
	import Menu from './components/Menu.svelte';
	import {sendSms, changeJobDetails} from './api.js';
	import {drivers, cols, jobs, jobsData, sortBy, selectedIds,
		freeTextFilter,
		smallActive,
		mediumActive,
		bigActive,
		tueActive,
		wedActive,
		thuActive,
		dayFilterExclusive,
		typeFilter,
		qualityFilter,
		hideDoneJobs,
		bounds,
		showMap,
	} from './store.js';
	import {getIdFromUrl, filter } from './utils/helpers.js';
    import JobsMap from './components/JobsMap.svelte';
	import { onMount } from 'svelte';
	export let googleMapsLoaded = false; // set in main.js
	let smsEditorType = '';
	let showDriverEditor = false;
	let showStateEditor = false;
	let showMenu = false;
	let showConfigMenu = false;
	let promise = getData();
	let prefs;
	// SMS editor vars
	let possibleRecipients;
	let recipients = [];
	let message = '';
	let menuX = 0;
	let menuY = 0;
	let helperToken;
	let tempMsgQueue = [];

	onMount(() => {
		if (typeof window.google !== 'undefined') {
			return;
		}
		function tryLoadingGmaps() {
			if (typeof prefs === 'undefined' || !($jobs && $jobs.length)) {
				return setTimeout(tryLoadingGmaps, 90);
			}
			const gmapsScript = document.createElement('script');
			gmapsScript.src = "https://maps.googleapis.com/maps/api/js?key=" + prefs.googleMapsToken + "&callback=initGMaps";
			document.documentElement.appendChild(gmapsScript);
		}
		tryLoadingGmaps();
	})

	async function getData(forceReload) {
		let res = await fetch(`${apiUrl}/prefs`);
		prefs = await res.json();
		cols.set(prefs.cols);
		res = await fetch(`${apiUrl}/jobs` + (forceReload ? '?refresh=1' : ''));

		if (res.ok) {
			let json = await res.json();
			jobsData.set(json);
			return true;
		} else {
			let text = await res.text();
			console.log(text);
			throw new Error('Ingen tilgang');
		}
	}

	async function getToken() {
		const res = await fetch(`${apiUrl}/helpertoken`);
		const data = await res.json();
		return data.token;
	}
	getToken().then(t => helperToken = t);

	function reload() {
		promise = getData(true);
	}

	function updateSelectedList(event) {
		let detail = event.detail; // {jobnr: 1, selected: true }
		if (detail.selected && $selectedIds.indexOf(detail.jobnr) === -1) {
			selectedIds.set([...$selectedIds, detail.jobnr]);
		} else if (!detail.selected && $selectedIds.indexOf(detail.jobnr) > -1) {
			$selectedIds.splice($selectedIds.indexOf(detail.jobnr), 1);
			selectedIds.set($selectedIds);
		}
	}
	let menuElm;

	function toggleMenu(targetElm) {
		if (showMenu) {
			showMenu = false;
		} else {
			let jobNr;
			let elm = targetElm;
			while(elm && !jobNr && elm.getAttribute) {
				jobNr = elm.getAttribute('data-id');
				elm = elm.parentNode;
			}
			if (jobNr && $selectedIds.indexOf(jobNr) === -1) {
				updateSelectedList({detail: {selected: true, jobnr: jobNr}});
			}
			if (jobNr || $selectedIds.length) {
				showMenu = true;
			}
		}
	}
	function considerClosingMenu(event) {
		let insideMenu = false;
		if (!(showMenu || showConfigMenu)) {
			return; // nothing to do
		}
		let elm = event.target;
		console.log(elm, elm.className)
		while(elm) {
			if (elm.className && elm.className.indexOf('menu') > -1) {
				insideMenu = true;
			}
			elm = elm.parentNode;
		}
		if (insideMenu) {
			return;
		}
		showMenu = false;
		showConfigMenu = false;
	}
	function onMouseDown(evt) {
		if (showMenu || showConfigMenu) {return;}
		menuX = event.clientX;
		// nudge menu left- og rightwards if the touch or
		//mouse cursor is too near edge
		if (menuX < window.innerWidth * 0.2) {
			menuX += window.innerWidth * 0.1;
		}
		if (menuX >= window.innerWidth - 200) {
			menuX -= 200;
		}
		menuY = event.clientY;
	}

	function flashMessage(message, isError) {
		tempMsgQueue = [...tempMsgQueue, {message, isError}];
		setTimeout(() =>
			tempMsgQueue = tempMsgQueue.slice(0, tempMsgQueue.length - 1),
		5000);
	}

	function initSms(type) {
		showMenu = false;
		let items = $selectedIds
			.map(item => $jobs.find(job => job[$cols.JOBNR] === item));
		if (type === 'donor') {
			possibleRecipients = items.map(item => ({
				name: item[$cols.CONTACT_PERSON], number: item[$cols.PHONE],
				address: item[$cols.ADDRESS],
			}));
			recipients = items.map(item => item[$cols.PHONE]);
			smsEditorType = type;
		} else {
			possibleRecipients = $drivers;
			message = 'Hei, foreslår at du henter følgende jobb(er): \n\n' +
				items.map(item => `${item[$cols.ADDRESS]}
${item[$cols.CONTACT_PERSON]}, ${item[$cols.PHONE]}`)
				.join('\n\n');
			message += `

Merk jobber som hentet her etterpå:
${baseUrl}/henting/?jobb=${
	encodeURIComponent(items.map(item => getIdFromUrl(item[$cols.JOBNR])).join(','))
}&token=${encodeURIComponent(helperToken)}&henter={number}`;
			smsEditorType = type;
		}
	}

	function selectAllShown() {
		const newList = [];
		$jobs.forEach(item => {
			newList.push(item[$cols.JOBNR]);
		});
		selectedIds.set(newList);
	}

	function openMap() {
		let str = gMapsDirection + ($selectedIds.map(item => {
			let data = $jobs.find(job => job[$cols.JOBNR] === item);
			return data[$cols.ADDRESS];
		})
		.join('/'));
		window.open(str);
	}

jobs.subscribe(data => {console.log('updated data! ', data)})
</script>
<div
	on:contextmenu|preventDefault={e => {
		toggleMenu(e.target)
	}}
	on:click={e => considerClosingMenu(e)}
	on:mousedown={e => onMouseDown(e)}
	on:mousemove={e => onMouseDown(e)}
>

<button class="conf" on:click|stopPropagation="{e => {showConfigMenu = true;}}">
	<img src="/images/wrench.png" width="24" alt="Innstillinger">
</button>

<h1>Loppisadmin</h1>

<style type="text/css">
	h1 {text-align: center;}
	.conf {position: absolute; padding: 4px; right: 8em}
	.conf img {vertical-align: middle;}
	table.main {
		width: 80%;
		margin-left: 10%;
		margin-right: 10%;
		border-collapse: collapse;
		border: 1px solid grey;
	}
	table.main tr:first-child {
		background: #eee;
		border-bottom: 1px solid black;
	}
	th {text-align: left; padding-left: 16px; }
	th li {
		display: inline-block;
		height: 20px;
		width: 20px;
		border-bottom: 1px solid grey;
		color: grey;
		font-weight: lighter;
		margin-left: 8px;
		cursor: pointer;
	}
	.smallActive, .mediumActive, .bigActive {
		border: 2px inset black;
		border-radius: 10px;
	}
	.smallActive, .mediumActive, .bigActive, li.monActive, li.tueActive, li.wedActive, li.thuActive {
		border-color: black;
		color: black;
	}
	label {font-weight: lighter; font-style: italic;}


/* Extra small devices (phones, 600px and down) */
@media only screen and (max-width: 600px) {
	th:nth-child(3) {display: none;}
	th:nth-child(4) {display: none;}
	th:nth-child(5) {display: none;}
	table {width: 99%; margin: 0;}
}

@media only screen and (max-width: 700px) {
	th:nth-child(3) {display: none;}
	.stufftype {width: 25%}
	.dayscol {width: 25%}
	table {width: 95%; margin: 2.5%;}
}
/* column styles */
.jobnr {
	width: 2%;
}
.address {
	background: #eee;
	width: 25%;
}
.cartype {
	width: 5%;
}
.quality {
	width: 10%;
}
.stufftype {
	width: 10%;
}
.dayscol {
	width: 20%;
}
.status {
	width: 15%;
}
.dataloading {
	position: fixed;
	left: 45%;
	right: 50%;
	top: 45%;
	bottom: 50%;
}
.gmap {
	position: fixed;
	bottom: 0;
	height: 45vh;
	width: 100%;
}
body {
	margin-bottom: 45vh;
}
.mapButton {
	position: fixed;
	bottom: 0;
	width: 100%;
	text-align: center;
	font-size: larger;
	padding: .5em;
}
</style>

<div>
{#await promise}
  <div>
	<div class="dataloading"><LoadingIcon />	<p style="text-align: center;">...henter data</p>
</div>
  </div>
{:then data}
	<table class="main">
		<tr>
			<th colspan="2"><input type="search" bind:value={$freeTextFilter} placeholder="Filtrer"></th>
			<th>
				<img src="/images/bigcar.png" alt="stor bil" height="22"
					class={$bigActive ? 'bigActive' : ''}
					on:click="{e => bigActive.set(!$bigActive)}"
					tabindex="0">
				<img src="/images/smallcar.png" alt="stasjonsvogn" height="22"
					class={$mediumActive ? 'mediumActive' : ''}
					on:click="{e => mediumActive.set(!$mediumActive)}"
					tabindex="0">
				<img src="/images/box.png" alt="1-3 bokser" height="22"
					class={$smallActive ? 'smallActive' : ''}
					on:click="{e => smallActive.set(!$smallActive)}"
					tabindex="0">
			</th>
			<th>
				<select bind:value={$typeFilter} on:change={e => typeFilter.set(e.target.value)}>
					<option value="">-</option>
					{#each prefs.types as theType}
						<option>{theType}</option>
					{/each}
				</select>
			</th>
			<th>
				<select bind:value={$qualityFilter} on:change={e => {
						qualityFilter.set(e.target.value)}
					}>
					<option value="">-</option>
					<option value="0">&#9733;</option>
					<option value="1">&#9733;&#9733;</option>
					<option value="2">&#9733;&#9733;&#9733;</option>
				</select>
			</th>
			<th>
				<ol class="days">
					<!--<li class:monActive on:click="{e => monActive = !monActive}">Ma</li>-->
					<li class={$tueActive ? 'tueActive' : ''} on:click="{e => tueActive.set(!$tueActive)}" tabindex="0">Ti</li>
					<li class={$wedActive ? 'wedActive' : ''} on:click="{e => wedActive.set(!$wedActive)}" tabindex="0">On</li>
					<li class={$thuActive ? 'thuActive' : ''} on:click="{e => thuActive.set(!$thuActive)}" tabindex="0">To</li>
				</ol>
			</th>
			<th>
				<label><input type="checkbox" bind:checked={$dayFilterExclusive} on:change={e=>dayFilterExclusive.set(e.target.checked)}>Bare valgte dager</label>
				<br><label><input type="checkbox" bind:checked={$hideDoneJobs}  on:change={e=>hideDoneJobs.set(e.target.checked)}>Skjul ferdige</label>
				<br><label>Sortering:
					<select bind:value={$sortBy} on:change={e => sortBy.set(e.target.value)}>
					<option value="street">Gatenavn</option>
					<option value="area">Område</option>
				</select></label>
			</th>
		</tr>
	{#each $jobs as theJob (theJob[$cols.JOBNR])}
		{#key theJob.selected}
		<RenderJob
			job={theJob}
			days={theJob[$cols.PICKUP_DAYS]}
			quality={theJob[$cols.QUALITY]}
			cols={$cols}
			on:select={e => updateSelectedList(e)}
		/>
		{/key}
	{/each}
	<col class="jobnr" />
	<col class="address" />
	<col class="cartype" />
	<col class="stufftype" />
	<col class="quality" />
	<col class="dayscol" />
	<col class="status" />
</table>

<p>
	Antall jobber totalt: {$jobsData.length}.
	Hentes nå: {$jobsData.filter(item => item[$cols.STATUS] === 'Hentes').length}
	Hentet: {$jobsData.filter(item => item[$cols.STATUS] === 'Hentet').length}
	Hentes ikke: {$jobsData.filter(item => item[$cols.STATUS] === 'Hentes ikke').length}
</p>

{#if smsEditorType}
	<Modal on:close="{() => smsEditorType = ''}">
		<h2 slot="header">Send SMS</h2>
		<SMSEditor
			on:cancel={e => {
				smsEditorType = '';
				message = '';
				possibleRecipients = null;
			}}
			on:sms={e => {
				sendSms(e.detail.recipients, e.detail.message)
				.then(() => {
					flashMessage('SMS sendt til ' + e.detail.recipients );
					return Promise.all($selectedIds.map(item => {
						const job = $jobs.find(job => job[$cols.JOBNR] === item);
						if (e.detail.smsEditorType === 'worker') {
							return changeJobDetails(item, $cols, {[$cols.STATUS]: 'Sendt til henter', [$cols.ASSIGNEE]: e.detail.recipients[0]});
						} else if (e.detail.smsEditorType === 'donor' && job && ['', 'Ny'].includes(job[$cols.STATUS])) {
							return changeJobDetails(item, $cols, {[$cols.STATUS]: 'Kontaktet'});
						}
						return Promise.resolve();
					}))
					.then(() => {
						selectedIds.set([]);
					})
				})
				.catch(err => flashMessage(err, true));
				message = '';
				possibleRecipients = null;
				smsEditorType = '';
			}}
			{smsEditorType}
			{possibleRecipients}
			{recipients}
			{message}
		/>
	</Modal>
{/if}
{#if showDriverEditor}
	<Modal on:close="{() => showDriverEditor = false}">
		<h2 slot="header">Oppdater hentere</h2>
		<DriverEditor
			on:cancel={e => {
				showDriverEditor = false;
			}}
		/>
	</Modal>
{/if}
{#if showStateEditor}
	<Modal on:close="{() => showStateEditor = false}">
		<h2 slot="header">Oppdater status</h2>
		<StateEditor
			on:cancel={e => {
				showStateEditor = false;
			}}
			on:statusupdate={e => {
				if (e.detail.newState) {
					$selectedIds.forEach(item => {
						let data = $jobs.find(job => job[$cols.JOBNR] === item);
						if (data[$cols.ASSIGNEE] && data[$cols.STATUS] === 'Hentes') {
							if(!confirm(`Vil du endre status for ${data[$cols.ADDRESS]} selv om den er akseptert av en henter?`)) {
								return; // don't update state behind assignee's back..
							}
						}
						changeJobDetails(item, $cols, {[$cols.STATUS]: e.detail.newState});
					});
				}
				showStateEditor = false;
			}}
		/>
	</Modal>
{/if}

{:catch error}
	<p style="color: red">{error.message}</p>
	{#if error.message === 'Ingen tilgang'}
		<form method="post" action="/api/letmein">
			<p>Send forespørsel om tilgang</p>
			<label>Mobilnummer: <input type="text" pattern="\d+" name="phone"></label><button type="submit">Send</button>
		</form>
	{/if}
{/await}
</div>

<Menu
	show={showMenu}
	x={menuX}
	y={menuY}
	items={[
		{
			label: 'SMS til giver', icon: '/images/sms.png',
			action: e => initSms('donor')
		},
		{
			label: 'SMS til henter', icon: '/images/sms.png',
			action: e => initSms('worker')
		},
		{
			label: 'Sett status', icon: '/images/wrench.png',
			action: e => (showStateEditor = true, showMenu = false)
		},
		{
			label: 'Vis på kart', icon: '/images/map.png',
			action: e => (openMap(), showMenu = false)
		},
	]}
/>
<Menu
	show={showConfigMenu}
	x={menuX}
	y={menuY}
	items={[
		{
			label: 'Hentere', icon: '/images/smallcar.png',
			action: e => (showDriverEditor = true, showConfigMenu = false)
		},
		{
			label: 'Oppdater data', icon: '/images/wrench.png',
			action: e => (showConfigMenu = false, reload())
		},
		{
			label: 'Merk alle', icon: '/images/check.png',
			action: e => (showConfigMenu = false, selectAllShown())
		},
		{
			label: 'Fjern merking', icon: '/images/nocheck.png',
			action: e => (showConfigMenu = false, $selectedIds.length = 0)
		},
		{
			label: 'Tom SMS', icon: '/images/sms.png',
			action: e => (showConfigMenu = false, smsEditorType = 'new')
		}
	]}
/>

{#each tempMsgQueue as msg, idx}
	<FlashMessage {...msg} index={idx} />
{/each}

{ #if googleMapsLoaded && $showMap}
<div class="gmap">
<JobsMap
  jobs={jobs}
  googleMapsToken={prefs.googleMapsToken}
  cols={$cols}
  on:select={e => updateSelectedList(e)}
  on:boundschange={e => bounds.set(e.detail.bounds)}
>
</JobsMap>
</div>
{ /if }
<div class="mapButton">
	<button on:click={e => showMap.set(!$showMap)} type="button">{$showMap ? 'Skjul kart' : 'Vis kart'}</button>
</div>

</div>
