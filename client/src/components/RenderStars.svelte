<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	export let qualityRanking = undefined;
	let img1 = '/images/star-empty.png';
	let img2 = '/images/star-full.png';
	let stars = [];
	if (qualityRanking === '' || qualityRanking === undefined) {
		stars = [img1, img1, img1];
	} else {
		for(let i=0; i <= qualityRanking; i++) {
			stars.push(img2);
		}
		for(let i = qualityRanking; i < 2; i++) {
			stars.push(img1);
		}
	}
	function handleClick(evt) {
		let idx = parseInt(evt.target.getAttribute('data-index'));
		qualityRanking = idx + 1;
		dispatch('qualityupdate', {kvalitet: idx});
		for (let i = 0; i <= idx; i++) {
			stars[i] = img2;
		}
		for(let i=idx + 1; i < stars.length; i++) {
			stars[i] = img1;
		}
	}
</script>
<style>
	img {
		width: 16px;
		height: 16px;
		transition: all .2s ease-in-out;
	}
	img:hover{
		transform: scale(1.1);
 	}
</style>
<div>
{#each stars as star, index}
	<img 
		src={star} 
		alt="poeng: {qualityRanking}" 
		data-index={index}
		on:click={handleClick}
	>
{/each}
</div>
