<script>
import { createEventDispatcher } from 'svelte';
export let recipients = [];
export let message = '';
export let possibleRecipients;
let showQuickReplies = !message;
const dispatch = createEventDispatcher();

let stdMessages = {
	'Bekreft data mottatt': 'Hei,\ntakk for at du har sendt inn skjema om loppehenting! :)\n\nVi henter hver kveld mellom 27. og 29. august (*ikke* september som det dessverre står på noen plakater). Vi kontakter deg på dette nummeret før henting.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
	'Hentes snart': 'Hei,\ntakk for at du vil gi korpset lopper. Passer det om noen kommer og henter hos deg snart?\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
	'Ikke IKEA': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge IKEA-møbler, så slike vil vi helst ikke ta imot.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
	'Ikke sofa': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge sofaer på loppemarked. Vi vil helst ikke ta imot sofaer med mindre de er av spesielt god kvalitet.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
	'Rekker ikke': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre rekker vi ikke å hente loppene dine i kveld. Dersom du har mulighet til å lever i skolegården, er det supert.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
	'Send foto?': 'Hei,\ntakk for at du vil gi korpset lopper! Kan du sende meg et foto av loppene?\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
};

function send() {
	if (typeof recipients === 'string') {
		dispatch('sms', {
			recipients: recipients.split(/,\s*/g),
			message
		});
	} else {
		dispatch('sms', {
			recipients, 
			message
		});		
	}
}

function addMessage(name) {
	if (name && stdMessages[name]) {
		message = stdMessages[name];
	}
}

</script>
<style>
	.to textarea { width: 90%; height: 3em; }
	.sms textarea { width: 90%; height: 200px; }
	select, input {font-size: 1em;}
</style>

<form on:submit|preventDefault={e => send()}>
	<table>
		<tr>
			<th>
				Til
			</th>
			<td class="to">
				{#if possibleRecipients && possibleRecipients.length}
					<select multiple bind:value={recipients} required>
						{#each possibleRecipients as recipient}
							<option value={recipient.number}>
								{recipient.name}{#if recipient.address}  - {recipient.address}{/if}
							</option>
						{/each}
					</select>
				{:else}
					<textarea bind:value={recipients} pattern="[0-9 ,]" required></textarea>
				{/if}
			</td>
		</tr>
		<tr>
			<th>SMS</th>
			<td class="sms">
				<textarea bind:value={message} required></textarea>
			</td>
		</tr>
		{#if showQuickReplies}
		<tr>
			<th>Kjappe svar</th>
			<td>
				<select on:change={e => addMessage(e.target.value)}>
					<option></option>
					{#each Object.keys(stdMessages) as name}
						<option>{name}</option>
						{/each}
				</select>
			</td>
		</tr>
		{/if}
		<tr><td colspan="2" align="center">
			<button type="submit" class="p8 br2">Send</button> 
			<button on:click={e => dispatch('cancel')} class="p8 br2" type="button">Avbryt</button></td></tr>
	</table>
</form>