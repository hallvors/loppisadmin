<script>
	export let w = 32;
	export let h = 32;
</script>
<style>
.lds-dual-ring {
  display: inline-block;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 26px;
  height: 26px;
  margin: 1px;
  border-radius: 50%;
  border: 5px solid #000;
  border-color: #000 transparent #000 transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<div class="lds-dual-ring" style="width: {w}px; height: {h}px"></div>