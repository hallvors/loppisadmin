<script>
export let name;
export let number;
</script>

<style>
	a {
		display: inline-block;
		padding-right: 1em;
	}
</style>

{name} 
<a href="https://www.gulesider.no/{encodeURIComponent(name)}/personer" target="_blank" title="Slå opp person på Gule sider">🔎</a>
<br>
{number} <a href="tel:{number}" title="Ring nummer"> ☎</a> 
<a href="sms:{number}" title="Send SMS">✉</a> 
<a href="https://www.gulesider.no/{number}/personer" target="_blank" title="slå opp nummer på Gule sider">🔎</a>
