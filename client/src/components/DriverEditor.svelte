<script>
	import {drivers} from '../store.js';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let addName = '';
	let addNumber = '';

	function createDriver(name, number) {
		drivers.update(drivers => {
			drivers.push({name, number});
			return drivers;
		});
		addNumber = addName = '';
	}
	function removeDriver(name, number) {
		drivers.update(drivers => {
			let idx = drivers.findIndex(driver => driver.name === name && driver.number === number);
			drivers.splice(idx, 1);
			return drivers;
		});
	}
</script>
<style>
	button.cancel {
		color: red;
		font-size: small;
		vertical-align: super;
	}
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
	span * {
		width: 100%;
	}
	span button {
		width: 40%;
	}
	span button:nth-child(2) {
		margin-left: 8px;
	}
	textarea {height: 100px;}

</style>
<div>
		{#if $drivers.length}
		<ul>
		{#each $drivers as {name, number}}
			<li><b>{name}</b>, <a href="tel:{number}">{number}</a> 
				<button class="cancel br2" on:click={e => removeDriver(name, number)}>X</button></li>
		{/each}
		</ul>
		{/if}

	<form  on:submit|preventDefault={e => createDriver(addName, addNumber)}>
		<p>
		<span>Navn: </span><span><input bind:value={addName} required></span>
		</p>
		<p>
		<span>Mobil: </span><span><input bind:value={addNumber} inputmode="tel" required></span>
		</p>
		<p><span></span><span>
			<button type="submit" class="p8 br2">Legg til</button>
			<button on:click={e => dispatch('cancel')} class="p8 br2" type="button">Lukk</button>
		</span>
	</form>
</div>