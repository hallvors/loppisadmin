<script>
export let message = '';
export let isError = false;
export let index = 0;
</script>
<style>
	div {
		position: fixed;
		bottom: 0;
		width: 100%;
		background: #ecf0b0;
	}
	.isError {
		background: #ff7f7f;
	}
</style>

<div class:isError style="bottom: {40 * index}px">
	{message}
</div>
