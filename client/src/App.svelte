
<script>
	import { fade } from 'svelte/transition';
	import {apiUrl, baseUrl} from './config.js';
	import RenderJob from './components/RenderJob.svelte';
	import Modal from './components/Modal.svelte';
	import SMSEditor from './components/SMSEditor.svelte';
	import DriverEditor from './components/DriverEditor.svelte';
	import FlashMessage from './components/FlashMessage.svelte';
	import Menu from './components/Menu.svelte';
	import {sendSms} from './api.js';
	import {drivers, jobs} from './store.js';
	import {getIdFromUrl, filter} from './utils/helpers.js';
	let showSmsEditor = false;
	let showDriverEditor = false;
	let showMenu = false;
	let showConfigMenu = false;
	let promise = getData();
	let freeTextFilter = '';
	let bigActive = true;
	let smallActive = true;
	let monActive = true;
	let tueActive = true;
	let wedActive = true;
	let thuActive = true;
	let dayFilterExclusive = false;
	let typeFilter = '';
	let types = [
		'',
		'Møbler',
		'Bøker',
		'Musikk',
		'Klær',
		'Film',
		'Sykler',
		'Elektrisk',
		'Sportsutstyr',
		'Kjøkkenutstyr',
		'Leker'
	];
	let selectedItems = [];
	// SMS editor vars
	let possibleRecipients;
	let recipients = [];
	let message = '';
	let hideDoneJobs = true;
	let menuX = 0;
	let menuY = 0;
	let helperToken;
	let tempMsgQueue = [];

	async function getData(forceReload) {
		const res = await fetch(`${apiUrl}/jobs` + (forceReload ? '?refresh=1' : ''));
		if (res.ok) {
			let json = await res.json();
			json.sort(
				(a, b) => a.adresseforhenting < b.adresseforhenting ? -1 : 1
			);
			json.forEach(item => {
				item.status = item.status || '';
			});
			jobs.set(json);
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

	function updatedSelectedList(event) {
		let detail = event.detail;
		if (detail.selected && selectedItems.indexOf(detail.id) === -1) {
			selectedItems = [...selectedItems, detail.id];
		} else if (!detail.selected && selectedItems.indexOf(detail.id) > -1) {
			selectedItems.splice(selectedItems.indexOf(detail.id), 1);
			selectedItems = selectedItems;
		}
	}
	let menuElm;

	function toggleMenu(targetElm) {
		if (showMenu) {
			showMenu = false;
		} else {
			let jobId;
			let elm = targetElm;
			while(elm && !jobId) {
				jobId = elm.getAttribute('data-id');
				elm = elm.parentNode;
			}
			if (jobId && selectedItems.indexOf(jobId) === -1) {
				updatedSelectedList({detail: {selected: true, id: jobId}});
			}
			console.log('show menu? ', {jobId, selectedItems})
			if (jobId || selectedItems.length) {
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
		if (menuX >= window.innerWidth - 200) {
			menuX -= 200;
		}
		menuY = event.clientY;
	}

	function flashMessage(message, isError) {
		tempMsgQueue.push({message, isError});
		setTimeout(() => tempMsgQueue.pop(), 300);
	}

	function initSms(type) {
		showMenu = false;
		let items = selectedItems
			.map(item => $jobs.find(job => job.id === item));
		if (type === 'donor') {
			possibleRecipients = items.map(item => ({
				name: item.navnpåkontaktperson, number: item.telefonnummer,
				address: item.adresseforhenting,
			}));
			recipients = items.map(item => item.telefonnummer);
			showSmsEditor = true;
		} else {
			possibleRecipients = $drivers;
			message = 'Hei, foreslår at du henter følgende jobb(er): \n\n' + 
				items.map(item => `${item.adresseforhenting}
${item.navnpåkontaktperson}, ${item.telefonnummer}`)
				.join('\n\n');
			message += `

Merk jobber som hentet her etterpå:
${baseUrl}/henting/?jobb=${
	encodeURIComponent(items.map(item => getIdFromUrl(item.id)).join(','))
}&token=${encodeURIComponent(helperToken)}&henter={number}`;
			showSmsEditor = true;
		}
	}

	function selectAllShown() {
		selectedItems.length = 0;
		$jobs.forEach(item => {
			if (filter(freeTextFilter, {smallActive, bigActive}, 
				{monActive, tueActive, wedActive, thuActive, dayFilterExclusive}, 
				typeFilter, hideDoneJobs, item)
			) {
				selectedItems.push(item.id);
			}
		});
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
	h1 {text-align: center;
		max-width: 60%;
		margin-left: auto;
		margin-right: auto;
	}
	.conf {float: right; padding: 4px;margin-right: 8em}
	.conf img {vertical-align: middle;}
	table {
		width: 80%;
		margin-left: 10%;
		margin-right: 10%;
		border-collapse: collapse;
		border: 1px solid grey;
	}
	table tr:first-child {
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
	.smallActive, .bigActive {
		border: 1px solid black;
	}
	.smallActive, .bigActive, li.monActive, li.tueActive, li.wedActive, li.thuActive {
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
</style>

{#await promise}
	<p>...henter data</p>
{:then data}
	<table>
		<tr>
			<th><input type="search" bind:value={freeTextFilter} placeholder="Filtrer"></th>
			<th>
				<img src="/images/bigcar.png" alt="stor bil" height="22" 
					class:bigActive on:click="{e => bigActive = !bigActive}">
				<img src="/images/smallcar.png" alt="liten bil" height="22"
					class:smallActive on:click="{e => smallActive = !smallActive}">				
			</th>
			<th>
				<select bind:value={typeFilter}>
					{#each types as theType}
						<option>{theType}</option>
					{/each}
				</select>
			</th>
			<th>
				<img src="/images/star-full.png" width="16" alt="antatt kvalitet">
				<img src="/images/star-full.png" width="16" alt="">
				<img src="/images/star-full.png" width="16" alt="">
			</th>
			<th>
				<ol class="days">
					<!--<li class:monActive on:click="{e => monActive = !monActive}">Ma</li>-->
					<li class:tueActive on:click="{e => tueActive = !tueActive}">Ti</li>
					<li class:wedActive on:click="{e => wedActive = !wedActive}">On</li>
					<li class:thuActive on:click="{e => thuActive = !thuActive}">To</li>
				</ol>
			</th>
			<th>
				<label><input type="checkbox" bind:checked={dayFilterExclusive}>Bare valgte dager</label>
				<br><label><input type="checkbox" bind:checked={hideDoneJobs}>Skjul hentede</label>
			</th>
		</tr>
	{#each $jobs as theJob, i}
		{#if filter(freeTextFilter, {smallActive, bigActive}, 
			{monActive, tueActive, wedActive, thuActive, dayFilterExclusive}, typeFilter, hideDoneJobs, theJob)
		}
			<RenderJob 
				itemData={theJob}
				itemSelected={selectedItems.indexOf(theJob.id) > -1}
				on:select={e => updatedSelectedList(e)}
			/>
		{/if}
	{/each}
	<col class="address" />
	<col class="cartype" />
	<col class="stufftype" />
	<col class="quality" />
	<col class="dayscol" />
	<col class="status" />
</table>

<p>
	Antall jobber totalt: {$jobs.length}. 
	Hentet: {$jobs.filter(item => item.status === 'Hentet').length}
</p>

{#if showSmsEditor}
	<Modal on:close="{() => showSmsEditor = false}">
		<h2 slot="header">Send SMS</h2>
		<SMSEditor 
			on:cancel={e => {
				showSmsEditor = false;
				message = '';
				possibleRecipients = null;
			}}
			on:sms={e => {
				sendSms(e.detail.recipients, e.detail.message)
				.catch(err => flashMessage(err, true))
				.then(() => flashMessage('SMS sendt til ' + e.detail.recipients ));
				message = '';
				possibleRecipients = null;
				showSmsEditor = false;
			}}
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
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
<Menu 
	show={showMenu}
	x={menuX}
	y={menuY} 
	items={[
		{label: 'SMS til giver', icon: '/images/sms.png', action: e => initSms('donor')},
		{label: 'SMS til henter', icon: '/images/sms.png', action: e => initSms('worker')},
	]}
/>
<Menu 
	show={showConfigMenu}
	x={menuX}
	y={menuY} 
	items={[
		{label: 'Hentere', icon: '/images/smallcar.png', action: e => showDriverEditor = true},
		{label: 'Oppdater data', icon: '/images/wrench.png', action: reload},
		{label: 'Merk alle', icon: '/images/check.png', action: e => selectAllShown() },
		{label: 'Fjern merking', icon: '/images/nocheck.png', action: e => selectedItems.length = 0 },
	]}
/>

{#each tempMsgQueue as msg, idx}
	<FlashMessage {...msg} index={idx} />
{/each}
</div>