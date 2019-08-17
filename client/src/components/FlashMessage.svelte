<script>
import { fade, fly } from 'svelte/transition';
export let message = '';
export let isError = false;
export let index = 0;
</script>
<style>
	div {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: PowderBlue;
		font-size: 1.1em;
		padding-top: 8px;
		padding-bottom: 8px;
		padding-left: 8px;
		border-top: 1px solid black;
	}
	.isError {
		background: #ff7f7f;
	}
</style>

<div class:isError style="bottom: {36 * index}px" 
	transition:fly="{{ y: 50, duration: 500 }}">
	{message}
</div>
