<script>
import { createEventDispatcher } from 'svelte';
import {states} from '../config.js';
const dispatch = createEventDispatcher();
let newState = '';
function send() {
	dispatch('statusupdate', {
		newState,
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
	span, b {
		display: table-cell;
		vertical-align: top;
		padding-top: 8px;
	}
	span:first-child {
		width: 30%;
		font-weight: bold;
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
	input, textarea, select {font-size: 1em;}
</style>
<form on:submit|preventDefault={e => send()}>
	<p>
		<b>Ny status: </b>
		<span>
			<select bind:value={newState}>
				{#each states as theState}
					<option>{theState}</option>
				{/each}
			</select>			
		</span>
	</p>
	<p>
		<span></span>
		<span>
			<button type="submit" class="p8 br2">Oppdater valgte</button> 
			<button on:click={e => dispatch('cancel')} class="p8 br2" type="button">Avbryt</button>			
		</span>
	</p>
</form>
