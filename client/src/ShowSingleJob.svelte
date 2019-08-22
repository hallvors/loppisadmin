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

	let params, promise;

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
	async function getData(token, ids) {
		const res = await fetch(`${apiUrl}/job/${encodeURIComponent(ids)}?token=${encodeURIComponent(token)}`);
		let json = await res.json();
		if (res.ok) {
			json = json.sort(
				(a, b) => a.adresseforhenting < b.adresseforhenting ? -1 : 1
			);
			json.forEach(job => {
				job.oldStatus = job.status === 'Hentes' ? null : job.status;
				job.admkom = job.admkom || '';
			});
			jobs.set(json);
		} else {
			let text = await res.text();
			console.log(text)
			throw new Error('Ingen tilgang');
		}
	}
	
	function update(id, detail) {
		return changeJobDetails(id, detail, params.token)
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
	}

	.commonmap {
		text-align: center;
	}
	textarea {height: 100px; width: 100%;font-size: 1em;}

</style>

{#await promise}
	<div class="loading"><LoadingIcon /></div>
{:then data}
	<h1>Hentinger</h1>
	{#if $jobs.length > 1}
		<p class="commonmap"><a href={
			gMapsDirection + $jobs.map(job => job.adresseforhenting).join('/')
		} target="_blank">Kart med alle adresser: <br><img src="/images/map.png" alt="alle adresser i kart" width="36"></a></p>
	{/if}
	{#each $jobs as job, i}
		{#if job.loading}<div class="loading"><LoadingIcon /></div>{/if}
		<section>
			<p>
				<b>Adresse: </b> <span>
					{job.adresseforhenting}
					<a href={
								gMapsDirection + job.adresseforhenting
					} target="_blank">
						<img src="/images/map.png" alt="adresse i kart" width="24">
					</a>
				</span>
			</p>
			<p>
				<b>Kontaktperson: </b>
				<span>
					<RenderPerson name={job.navnpåkontaktperson} number={job.telefonnummer} />
				</span>
			</p>
			<p>
				<b>Typer: </b> <span><RenderTypes types={job.typerlopper} showAll={true} /></span>
			</p>
			{#if job.informasjonomloppene} <p><b>Om loppene: </b><i>{job.informasjonomloppene}</i></p>{/if}
			<p><b>Estimert kvalitet: </b><span>
				<RenderStars qualityRanking={job.kvalitet}  on:qualityupdate={e => update(job.id, e.detail)} />
			</span></p>
			<p>
				<b>Administrators/henteres kommentarer:</b>
				<span>
					<textarea
						bind:value={job.admkom}
						on:change={e => update(job.id, {admkom: e.target.value}) }
					></textarea>
				</span>
			</p>
			<p>
				<b>Status: </b><span>
					<em>{job.status}</em> <br>
					{#if job.hentesav && job.hentesav === params.henter}
						<br>
						<em transition:fade><br>★ ★ ☺   Du har tatt på deg jobben - takk!  ☺ ★ ★</em>
					{/if}
				</span>
			</p>
			<p>
				<b>Oppdater status:</b><span>
					{#if job.hentesav === params.henter && job.status === 'Hentes'}
						<button
							on:click={e => update(job.id, {status: 'Hentet', hentesav: params.henter})}
							class="p8 br2"
						>
							Ferdig hentet!
						</button>
						<button
							on:click={e => update(job.id, {status: job.oldStatus || 'Ny', hentesav: ''})}
							class="p8 br2"
						>
							Vi rekker ikke å hente likevel
						</button>
						<button
							on:click={e => update(job.id, {status: 'Hentes ikke', hentesav: ''})}
							class="p8 br2"
						>
							Jobben skal ikke hentes
						</button>
					{:else}
						<button
							on:click={e => update(job.id, {status: 'Hentes', hentesav: params.henter})}
							class="p8 br2"
						>
							Vi tar jobben!
						</button>
					{/if}
				</span>
			</p>
		</section>
	{/each}
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

