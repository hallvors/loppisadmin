<script>
export let job;

import { createEventDispatcher, onMount } from 'svelte';
const dispatch = createEventDispatcher();


let number = job.telefonnummer;
let info = job.informasjonomloppene;
let time = job.hentetidspunktkryssavsåmangedukan.split(/,\s*/g);
let address = job.adresseforhenting;
let size = job.størrelse;
const bigStr = 'Store ting (vare-bil eller tilhenger kreves ved henting)';

function update() {
	dispatch('update', {
		telefonnummer: number,
		adresseforhenting: address,
		informasjonomloppene: info,
		hentetidspunktkryssavsåmangedukan: time.join(', '),
		størrelse: size,
	});
}

</script>
<style type="text/css">
	form {
		display: table;
		width: 90%;
		margin-left: 5%
	}
	p {
		display: table-row;
		width: 100%;
		margin-top: 8px;
	}
	span {
		display: table-cell;
		vertical-align: top;
		padding-top: 8px;
	}
	span:first-child {
		width: 30%;
	}
	span>input, span>textarea, span>select {
		width: 100%;
	}
	span button {
		width: 40%;
	}
	span button:nth-child(2) {
		margin-left: 8px;
	}
	textarea {height: 100px;}
	input, textarea, select {font-size: 1em;}
	span label {
		display: block;
		width: 45%;
		float: left;
	}
	span label img {
		vertical-align: bottom;
	}
</style>
<form  on:submit|preventDefault={e => update()}>
		<p>
			<span>Mobilnummer:</span><span><input bind:value={number} inputmode="tel"></span>
		</p>
		<p>
			<span>Adresse for henting:</span><span><textarea bind:value={address}></textarea></span>
		</p>
		<p>
			<span>Om loppene:</span><span><textarea bind:value={info}></textarea></span>
		</p>
		<p>
			<span>Hentetidspunkt:</span><span>
				<select multiple bind:value={time}>
					<!--<option>Mandag kveld</option>-->
					<option>Tirsdag kveld</option>
					<option>Onsdag kveld</option>
					<option>Torsdag kveld</option>
				</select>
			</span>
		</p>
		<p>
			<span>Type bil:</span>
			<span>
				<label><input
					type="radio"
					name="size"
					bind:group={size}
					value={bigStr}>
						<img src="/images/bigcar.png" alt="stor bil" width="36">
				</label>
				<label><input
					type="radio"
					name="size"
					bind:group={size}
					value={''}>
						<img src="/images/smallcar.png" alt="liten bil" width="36">
				</label>
			</span>
		</p>
		<p><span></span>
		<span>
			<button type="submit" class="p8 br2">Oppdater</button> 
			<button type="button" class="p8 br2" on:click={e => dispatch('cancel')}>Avbryt</button>
		</span></p>
</form>
