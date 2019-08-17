<script>
	import {apiUrl, baseUrl} from './config.js';
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
		width: 60%; margin-left: 20%;
		border: 1px solid black;
		padding: 8px;
	}
	p {
		display: table-row;
		border-bottom: 1px solid grey;
	}
	p b, p address, p span, p i {
		display: table-cell;
		border: 16px solid transparent
	}
	p *:first-child {width: 20%;}
</style>

{#await promise}
	<div class="loading"><LoadingIcon /></div>
{:then data}
	{#each $jobs as job}
		<h1>Hentejobb</h1>
		<section>
			<p>
				<b>Adresse: </b> <span>
					{job.adresseforhenting}
					{#if job.loading}<LoadingIcon />{/if}
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
			<p><b>Om loppene: </b><i>{job.informasjonomloppene}</i></p>
			<p><b>Estimert kvalitet: </b><span>
				<RenderStars qualityRanking={job.kvalitet}  on:qualityupdate={e => update(job.id, e.detail)} />
			</span></p>
			<p>
				<b>Status: </b><span>
					<em>{job.status}</em> <br><br>
					<button 
						on:click={e => update(job.id, {status: 'Hentes', hentesav: params.henter})}
						class="p8 br2"
					>
						Vi skal dit nå
					</button>
					<button 
						on:click={e => update(job.id, {status: 'Hentet', hentesav: params.henter})}
						class="p8 br2"
					>
						Ferdig hentet!
					</button>
					<button 
						on:click={e => update(job.id, {status: 'Ny', hentesav: ''})}
						class="p8 br2"
					>
						Kan ikke hente denne
					</button> 
				</span>
			</p>
		</section>
	{/each}
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

