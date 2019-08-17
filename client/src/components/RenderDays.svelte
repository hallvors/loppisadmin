<script>
	export let days;
	let state = {/*Ma: false,*/ Ti: false, On: false, To: false};
	days.split(/, ?/g).forEach(day => {
		state[day.substr(0,2)] = true;
	});
</script>
<style>
	ol {
		list-style-type: none;
	}
	li {
		display: inline-block;
		height: 20px;
		width: 20px;
		color: grey;
		visibility: hidden;
		margin-left: 8px;
	}
	li.active {
		color: black;
		visibility: visible;
	}
</style>
<ol>
{#each Object.keys(state) as day}
	<li class:active="{state[day]}">{day}</li>
{/each}
</ol>