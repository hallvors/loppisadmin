<script>
import RenderDays from './RenderDays.svelte';
import RenderTypes from './RenderTypes.svelte';
import Modal from './Modal.svelte';
import DetailsEditor from './DetailsEditor.svelte';
import RenderPerson from './RenderPerson.svelte';
import RenderStars from './RenderStars.svelte';
import LoadingIcon from './LoadingIcon.svelte';
import {changeJobDetails} from '../api.js';
import { createEventDispatcher } from 'svelte';
import {drivers} from '../store.js';
import {normalizeNumber} from '../utils/helpers.js';

const dispatch = createEventDispatcher();

export let itemData;
export let itemSelected = false;
let expanded = false;
let states = [
	'',
	'Ny',
	'Kontaktet',
	'Mangler info',
	'Hentes',
	'Hentet',
	'Avvist',
];

$: loading = itemData.loading;

let showEditor = false;

function update(event) {
	showEditor = false;
	return changeJobDetails(itemData.id, event.detail)
	.catch(err => alert(err));
}

function getDriverName(number) {
	let driver = $drivers.find(driver => driver.number === normalizeNumber(number));
	 return driver ? driver.name : normalizeNumber(number);
}

function statusVerbString(state) {
	return state === 'Hentet' ? 'hentet' : 'henter nå';
}

</script>
<style>
	.job {
		margin-bottom: 8px;
		border-top: 1px solid grey;
		border-collapse: collapse;
	}
	.job:hover {
		background: #eee;
	}
	td {
		padding-left: 16px;
		padding-right: 16px;
	}
	.job td:first-child {
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.extrainfo {
		border-bottom: 1px solid grey;
	}
	tr.itemSelected {
		font-weight: bold;
	}
	tr.itemSelected:after {
	}
.statuscell {
	position: relative;
	cursor: pointer;
}
label {
  cursor: pointer;
}
input[type="checkbox"]{display:none;}
input[type="checkbox"] + label {float:right;}

input[type="checkbox"]:not(:checked) + label {
	color: grey;
}
input[type="checkbox"]:checked + label {
	color: black;
}
input[type="checkbox"]:checked + label:after {
	content: " ";
	display: block;
	width: 0;   
	height: 0; 
	border-top: 30px solid transparent;     
	border-right:30px solid black;
	transform: rotate(-90deg);
	position: absolute;
	top: 0;
	right: 0;
}
select {
	max-width: 65%;
	float: left;
}

.smallscreen {display: none;}

@media only screen and (max-width: 600px) {
	td:nth-child(3) {display: none;}
	td:nth-child(4) {display: none;}
	td:nth-child(5) {display: none;}
	.smallscreen {display: block;}
}
@media only screen and (max-width: 700px) {
	td:nth-child(3) {display: none;}
}

button img {vertical-align: middle;}
.loading {position: relative;}
.loading div {
	position: absolute;
	right: 16px;
	top: 8px;
	z-index: 10;
}
.hentesav {font-size: x-small;	max-width: 65%;
clear:left;
}
</style>

<tr class="job" 
	class:itemSelected
	data-id={itemData.id}
>
<td class:expanded class:loading on:click="{e => expanded = !expanded}" tabindex="0" >
{#if itemData.loading}<div><LoadingIcon w=24 h=24 /></div>{/if}
{itemData.adresseforhenting}
<a href="https://www.google.no/maps/?q={
	encodeURIComponent(itemData.adresseforhenting)
}" on:click|stopPropagation target="_blank">🔎</a>
<br>
<div class="smallscreen">
<i>{itemData.hentetidspunktkryssavsåmangedukan}</i>
</div>
</td>
<td class="car">
{#if itemData.størrelse}
<img src="/images/bigcar.png" alt="stor bil" height="22">
{:else}
<img src="/images/smallcar.png" alt="liten bil" height="22">
{/if}
</td>
<td class="typefilter"><RenderTypes types={itemData.typerlopper} /></td>
<td><RenderStars qualityRanking={itemData.kvalitet} on:qualityupdate={update}/></td>
<td>
	<RenderDays days={itemData.hentetidspunktkryssavsåmangedukan}/>
</td>
<td class="statuscell" on:click={e => {
	if (['SELECT', 'LABEL', 'INPUT', 'OPTION', 'A'].indexOf(e.target.tagName) === -1) {
		dispatch('select', {id: itemData.id, selected: !itemSelected});
	}
}}>
<input type="checkbox" bind:checked={itemSelected} id="select{itemData.id}" on:change="{e => dispatch('select', {id: itemData.id, selected: e.target.checked})}">
<label for="select{itemData.id}" tabindex="0">✓</label>
<select bind:value={itemData.status} on:change|stopPropagation="{e => update({detail: {status: e.target.value}})}">
	{#each states as theState}
		<option>{theState}</option>
	{/each}
</select>
{#if itemData.hentesav}
	<div class="hentesav"><a href="tel:{normalizeNumber(itemData.hentesav)}">
		{getDriverName(itemData.hentesav)}</a> {statusVerbString(itemData.status)}
	</div>
{/if}
</td>
</tr>
{#if expanded}<tr data-id={itemData.id}><td></td><td colspan="3" class="extrainfo">
	<p>
		<RenderPerson name={itemData.navnpåkontaktperson} number={itemData.telefonnummer} />
	</p>
	<p>{itemData.typerlopper}</p>
	<p><i>{itemData.informasjonomloppene}</i></p>
</td>
<td>
	<button on:click={e => showEditor = true}><img src="/images/edit.png" alt="endre detaljer" width="36"></button>
	{#if showEditor}
		<Modal on:close="{() => showEditor = false}" >
			<h2 slot="header">Endre detaljer</h2>
			<DetailsEditor job={itemData} on:update={update} on:cancel={e => showEditor = false} />
		</Modal>
	{/if}
</td>
</tr>
{/if}

