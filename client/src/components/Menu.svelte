<script>
	import {onMount} from 'svelte';
	export let show = false;
	export let items = []; // {action, label, icon}
	export let x = 0;
	export let y = 0;
	onMount(() => document.getElementsByTagName('button')[0].focus());
</script>

<style type="text/css">
div {
	width: 15%;
	background: #fff;
	padding: 0px;
	min-width: 140px;
	box-shadow: 3px 6px 2px 0px rgba(189,182,189,1);
	position: fixed;
	z-index: 10;
	display: none;
}
.show {
	display: block;
}
button {
	width: 100%;
	background: transparent;
	border: 1px solid grey;
	padding: 6px;
	font-size: 1.2em;
	margin: 0;
	cursor: pointer;
	text-align: left;
}
button:hover {
	border-color: black;
}
img {
	width: 24px;
	height: 24px;
	vertical-align: middle;
}
</style>

<div class="menu" style="top: {y}px; left: {x}px; position: fixed;" class:show>
	{#each items as item}
		<button on:click={item.action} class="menu">
			{#if item.icon}<img src={item.icon} alt="" />{/if}
			{item.label}
		</button>
	{/each}
</div>
