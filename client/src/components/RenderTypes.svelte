<script>
import { beforeUpdate } from 'svelte';
export let types = [];
export let showAll = false;
let icons = {
	'Møbler': '/images/mobler.png',
	'Bøker': '/images/boker.png',
	'Musikk': '/images/musikk.png',
	'Klær': '/images/klaer.png',
	'Film': '/images/film.png',
	'Sykler': '/images/sykkel.png',
	'Elektrisk': '/images/elektrisk.png',
	'Sportsutstyr': '/images/sport.png',
	'Kjøkkenutstyr': '/images/kjokken.png',
	'Leker': '/images/leker.png'
};
beforeUpdate(() => {
	if (typeof types === 'string') {
		types = types.split(/,\s+/g);
	}
});
types = types.split(/,\s+/g);
</script>
{#each types as typ}
{#if icons[typ]}
<img src={icons[typ]} alt={typ} title={typ} height="24" />
{:else if showAll}
<br>{typ}
{/if}
{/each}