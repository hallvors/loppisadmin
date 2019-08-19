<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();
	let modalElm;
	let lastActiveElement;
	onMount(() => {
		if(modalElm && modalElm.scrollIntoView) {
			modalElm.scrollIntoView();
		}
		if (modalElm && modalElm.querySelector) {
			// accessibility: focus management
			lastActiveElement = document.activeElement;
			modalElm.querySelector('input, select, textarea, button').focus();
		}
	});
	onDestroy(() => {
		// TODO: this doesn't truly work as intended because focus will have gone to
		// the right-clicked element or the menu element activated most of the time
		if (lastActiveElement && lastActiveElement.focus) {
			lastActiveElement.focus();
		}
	});
</script>

<style>
	.modal-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.3);
	}

	.modal {
		position: fixed;
		left: 50%;
		top: 50%;
		width: calc(100vw - 4em);
		max-width: 32em;
		max-height: calc(100vh - 4em);
		overflow: auto;
		transform: translate(-50%,-50%);
		padding: 1em;
		border-radius: 0.2em;
		background: white;
	}

	button {
		display: block;
	}
</style>

<div class='modal-background' on:click='{() => dispatch("close")}'></div>

<div class='modal' bind:this={modalElm}>
	<slot name='header'></slot>
	<hr>
	<slot></slot>
	<hr>

<!-- 	<button on:click='{() => dispatch("close")}'>close modal</button> -->
</div>
