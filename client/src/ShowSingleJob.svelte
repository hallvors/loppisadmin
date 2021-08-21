<script>
	import { fade } from 'svelte/transition';
	import {apiUrl, baseUrl, gMapsDirection} from './config.js';
	import {jobs} from './store.js';
	import LoadingIcon from './components/LoadingIcon.svelte';
	import RenderDays from './components/RenderDays.svelte';
	import RenderTypes from './components/RenderTypes.svelte';
	import RenderStars from './components/RenderStars.svelte';
	import RenderPerson from './components/RenderPerson.svelte';
	import {changeJobDetails} from './api.js';
	import {normalizeNumber} from './utils/helpers.js';

	let params, promise;
	let prefs;
	if (typeof location !== "undefined") {
		params = location.search
			.substr(1)
			.split(/&/g)
			.map(item => {
				let parts = item.split(/=/);
				return { [parts[0]]: decodeURIComponent(parts[1]) };
			})
			.reduce((all, now) => Object.assign(all, now), {});
	}
	if (params && (params.token && params.jobb)) {
		promise = getData(params.token, params.jobb)
	}

	function normalizeJobList(jobs) {
		jobs = jobs.sort(
			(a, b) => a[prefs.head.ADDRESS] < b[prefs.head.ADDRESS] ? -1 : 1
		);
		jobs.forEach(job => {
			job.oldStatus = job[prefs.head.STATUS] === 'Hentes' ? null : job[prefs.head.STATUS];
		});
		return jobs;
	}

	async function getData(token, ids) {
		let res = await fetch(`${apiUrl}/prefs`)
		prefs = await res.json();
		res = await fetch(`${apiUrl}/job/${encodeURIComponent(ids)}?token=${encodeURIComponent(token)}`);
		let json = await res.json();
		if (res.ok) {
			json = normalizeJobList(json);
			jobs.set(json);
		} else {
			let text = await res.text();
			console.log(text)
			throw new Error('Ingen tilgang');
		}
	}
	async function getDataByAssignee(token, number) {
		const res = await fetch(`${apiUrl}/byperson/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`);
		let json = await res.json();
		if (res.ok) {
			json = normalizeJobList(json);
			jobs.set(json);
		} else {
			let text = await res.text();
			console.log(text)
			throw new Error('Ingen tilgang');
		}
	}

	function update(jobnr, detail) {
		return changeJobDetails(jobnr, prefs.head, detail, params.token)
		.catch(err => alert(err));
	}

jobs.subscribe(data => {console.log('updated data! ', data)})
</script>
<style>
	.loading {
		position: fixed;
		left: 45%;
		right: 50%;
		top: 45%;
		bottom: 50%;
	}
	h1 {text-align: center;}
	section {
		display: table;
		width: 90%; margin-left: 5%;
		border: 1px solid black;
		padding: 8px;
	}
	section p {
		display: table-row;
		border-bottom: 1px solid grey;
	}
	section p b, section p address, section p span, section p i {
		display: table-cell;
		border: 8px solid transparent;
		vertical-align: top;
	}
	section p b:first-child {width: 5%;}
	@media only screen and (min-width: 700px) {
		section {width: 60%; margin-left: 20%}
		section p b:first-child {width: 15%;}
		section p b, section p address, section p span, section p i {
			border: 16px solid transparent
		}

	}
	button {
		margin-bottom: 8px;
		font-size: 1.2em;
	}

	.commonmap {
		text-align: center;
	}
	textarea {height: 100px; width: 100%;font-size: 1em;}
	.Hentet {
		border-color: green;
		background: #fefffe;
		position: relative;
		overflow: hidden;
	}
	.Hentet .hideondone {display: none;}
	.Hentet:after {
		position: absolute;
		line-height: 32px;
		text-align: center;
		top: 24px;
		right: 40px;
		width: 70%;
		transform-origin: 40% 90%;
		opacity: 0.5;
		transform: translate(35%, -30%) rotate(35deg);
		font-size: 1.5em;
	}
	.Hentet:after {
		content: 'Hentet';
		background-color: yellow;
	}
	.jobnr {
		display: inline-block;
		height: 100%;
		padding: 4px;
		background: #aaa;
		float: right;
	}

</style>

{#await promise}
	<div class="loading"><LoadingIcon /></div>
{:then data}
	<h1>Hentinger</h1>
	{#if $jobs.length > 1}
		<p class="commonmap"><a href={
			gMapsDirection + $jobs.map(job => job[prefs.head.ADDRESS]).join('/')
		} target="_blank">Kart med alle adresser: <br><img src="/images/map.png" alt="alle adresser i kart" width="36" ></a></p>
	{/if}
	{#each $jobs as job, i}
		{#if job.loading}<div class="loading"><LoadingIcon /></div>{/if}
		<section class={job[prefs.head.STATUS]}>
			<p>
				<b>Adresse: </b> <span>
					{job[prefs.head.ADDRESS]}
					<a href={
								gMapsDirection + job[prefs.head.ADDRESS]
					} target="_blank">
						<img src="/images/map.png" alt="adresse i kart" width="24">
					</a>
				</span>
				<span class="jobnr">{job[prefs.head.JOBNR]}</span>
			</p>
			<p>
				<b>Kontaktperson: </b>
				<span>
					<RenderPerson name={job[prefs.head.CONTACT_PERSON]} number={job[prefs.head.PHONE]} />
				</span>
			</p>
			<p class="hideondone">
				<b>Typer: </b> <span><RenderTypes types={job[prefs.head.TYPES]} showAll={true} /></span>
			</p>
			{#if job[prefs.head.DESC]} <p><b>Om loppene: </b><i>{job[prefs.head.DESC]}</i></p>{/if}
			<p class="hideondone"><b>Estimert kvalitet: </b><span>
				<RenderStars qualityRanking={job[prefs.head.QUALITY]}  on:qualityupdate={e => update(job[prefs.head.JOBNR], e.detail)} />
			</span></p>
			<p class="hideondone">
				<b>Administrators/henteres kommentarer:</b>
				<span>
					<textarea
						bind:value={job[prefs.head.ADMCOMMENT]}
						on:change={e => update(job[prefs.head.JOBNR], {[prefs.head.ADMCOMMENT]: e.target.value}) }
					></textarea>
				</span>
			</p>
			<p>
				<b>Status: </b><span>
					<em>{job[prefs.head.STATUS]}</em> <br>
					{#if job[prefs.head.ASSIGNEE] && job[prefs.head.ASSIGNEE] === params.henter}
						{#if job[prefs.head.STATUS] === 'Hentes'}
							<br>
							<em transition:fade><br>★ ★ ☺   Du har tatt på deg jobben - takk!  ☺ ★ ★</em>
						{:else if job[prefs.head.STATUS] === 'Hentet'}
							<br>
							<em transition:fade><br>★ ★ ☺  Takk for at du hentet!  ☺ ★ ★</em>
						{/if}
					{/if}
					{#if job[prefs.head.ASSIGNEE] && job[prefs.head.ASSIGNEE] !== params.henter}
						<br>
						<em><b>Merk: jobben er akseptert av en annen. Sjekk med <a href={'tel:' + normalizeNumber(job[prefs.head.ASSIGNEE])}>{normalizeNumber(job[prefs.head.ASSIGNEE])}</a> om du vurderer å hente.</b></em>
					{/if}
				</span>
			</p>
			<p class="hideondone">
				<b>Oppdater status:</b><span>
					{#if job[prefs.head.ASSIGNEE] === params.henter && job[prefs.head.STATUS] === 'Hentes'}
						<button
							on:click={e => update(job[prefs.head.JOBNR], {[prefs.head.STATUS]: 'Hentet', [prefs.head.ASSIGNEE]: params.henter})}
							class="p8 br2"
						>
							Ferdig hentet!
						</button>
						<button
							on:click={e => update(job[prefs.head.JOBNR], {[prefs.head.STATUS]: job.oldStatus || 'Ny', [prefs.head.ASSIGNEE]: ''})}
							class="p8 br2"
						>
							Vi rekker ikke å hente likevel
						</button>
						<button
							on:click={e => update(job[prefs.head.JOBNR], {[prefs.head.STATUS]: 'Hentes ikke', [prefs.head.ASSIGNEE]: ''})}
							class="p8 br2"
						>
							Jobben skal ikke hentes
						</button>
					{:else}
						<button
							on:click={e => update(job[prefs.head.JOBNR], {[prefs.head.STATUS]: 'Hentes', [prefs.head.ASSIGNEE]: params.henter})}
							class="p8 br2"
						>
							Vi tar jobben!
						</button>
					{/if}
				</span>
			</p>
		</section>
	{/each}
	<hr>
	<button
		on:click={e => promise = getDataByAssignee(params.token, params.henter)}
		class="p8 br2">
			Alle mine jobber
	</button>

{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

