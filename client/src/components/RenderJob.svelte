<script>
import RenderDays from './RenderDays.svelte';
import RenderTypes from './RenderTypes.svelte';
import Modal from './Modal.svelte';
import DetailsEditor from './DetailsEditor.svelte';
import RenderPerson from './RenderPerson.svelte';
import RenderStars from './RenderStars.svelte';
import LoadingIcon from './LoadingIcon.svelte';
import {changeJobDetails} from '../api.js';
import {createEventDispatcher} from 'svelte';
import {drivers} from '../store.js';
import {SIZE_BIG, SIZE_MEDIUM, states} from '../config.js';
import {normalizeNumber} from '../utils/helpers.js';

const dispatch = createEventDispatcher();

export let job;
export let cols;
export let days;
export let quality;
let itemSelected = job.selected;
let expanded = false;

console.log('will render', job, job.selected, job.loading, {days, quality})

$: loading = job.loading;

let showEditor = false;

function update(event) {
	showEditor = false;
	return changeJobDetails(job[cols.JOBNR], cols, event.detail)
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
		vertical-align: top;
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
.statuscell {
	position: relative;
	cursor: pointer;
}
.cen {
	text-align: center;
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
textarea {height: 150px; width: 100%;font-size: 1em;}
.jobnr {
	padding: 4px;
	background: #aaa;
	margin-left: -14px;
}
small.area {
	font-size: x-small;
	text-transform: capitalize;
}
</style>

<tr class="job"
	class:itemSelected
	data-id={job[cols.JOBNR]}
>
<td class="jobnr">{job[cols.JOBNR]}</td>
<td class:expanded class:loading on:click="{e => expanded = !expanded}" tabindex="0" >
{#if job.loading}<div><LoadingIcon w=24 h=24 /></div>{/if}
{job[cols.ADDRESS]}
<a href="https://www.google.no/maps/?q={
	encodeURIComponent(job[cols.ADDRESS])
}" on:click|stopPropagation target="_blank">🔎</a>
<br><small class="area">{job[cols.AREA]}</small>
<br>
<div class="smallscreen">
<i>{job[cols.PICKUP_DAYS]}</i>
</div>
</td>
<td class="car">
{#if job[cols.SIZE] === SIZE_BIG}
<img src="/images/bigcar.png" alt="varebil" height="22">
{:else if job[cols.SIZE] === SIZE_MEDIUM}
<img src="/images/smallcar.png" alt="stasjonsvogn" height="22">
{:else}
<img src="/images/box.png" alt="1-3 bokser" height="22">
{/if}
</td>
<td class="typefilter"><RenderTypes types={job[cols.TYPES]} /></td>
<td><RenderStars {cols}
	qualityRanking={quality}
	on:qualityupdate={update}/></td>
<td>
	<RenderDays days={days}/>
</td>
<td class="statuscell" on:click={e => {
	if (['SELECT', 'LABEL', 'INPUT', 'OPTION', 'A'].indexOf(e.target.tagName) === -1) {
		dispatch('select', {jobnr: job[cols.JOBNR], selected: !itemSelected});
	}
}}>
<input type="checkbox" bind:checked={itemSelected} id="select{job[cols.JOBNR]}" on:change="{e => dispatch('select', {jobnr: job[cols.JOBNR], selected: e.target.checked})}">
<label for="select{job[cols.JOBNR]}" tabindex="0">✓</label>
<select
	bind:value={job[cols.STATUS]}
	on:change|stopPropagation="{e => update({detail: {[cols.STATUS]: e.target.value}})}"
	disabled={Boolean(job[cols.ASSIGNEE])}
>
	{#each states as theState}
		<option>{theState}</option>
	{/each}
</select>
{#if job[cols.ASSIGNEE]}
	<div class="hentesav"><a href="tel:{normalizeNumber(job[cols.ASSIGNEE])}">
		{getDriverName(job[cols.ASSIGNEE])}</a> {statusVerbString(job[cols.STATUS])}
	</div>
{/if}
</td>
</tr>
{#if expanded}<tr data-id={job[cols.JOBNR]}><td></td><td colspan="3" class="extrainfo">
	<RenderPerson name={job[cols.CONTACT_PERSON]} number={job[cols.PHONE]} />
	<p>{job[cols.TYPES]}</p>
	<p><i>{job[cols.DESC]}</i></p>
	<p class="cen">
		<button on:click={e => showEditor = true}><img src="/images/edit.png" alt="endre detaljer" width="36"></button>
	</p>
	{#if showEditor}
		<Modal on:close="{() => showEditor = false}" >
			<h2 slot="header">Endre detaljer</h2>
			<DetailsEditor job={job} cols={cols} on:update={update} on:cancel={e => showEditor = false} />
		</Modal>
	{/if}
</td>
<td colspan="2">
	Kommentarer fra admin/hentere:<br>
	<textarea
		bind:value={job[cols.ADMCOMMENT]}
		on:change={e => changeJobDetails(job[cols.JOBNR], cols, {[cols.ADMCOMMENT]: e.target.value}) }
	></textarea>
</td>
</tr>
{/if}
