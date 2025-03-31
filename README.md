# Loppisadmin

![Skjemdump av nettside](https://github.com/hallvors/loppisadmin/blob/master/docs/images/overview.png?raw=true)

Nettside for å ha oversikt over, oppdatere og fordele jobber når lopper skal hentes.

Hente-administrator kan kontakte givere (pr SMS) og sende utvalgte jobber til hentere (pr SMS).

Hentere kan oppdatere status på jobbene til "Hentes", "Hentet" (eller sette den tilbake til "Ny" om de ikke rekker over jobben). Flere detaljer om bruk av systemet finnes i [Loppisadmin wiki](https://github.com/hallvors/loppisadmin/wiki).

Data hentes fra og lagres i et regneark på Google docs. Backend kjører på Node.js, frontend er basert på Svelte.

## Oppsett

Følgende miljøvariabler må settes:

`google__auth`: JSON-data fra autentiseringsfil for Google "service account". Lastes ned fra https://console.developers.google.com/ . Fjern linjeskift fra JSON-fil om den skal legges til via kommando-linje (`heroku config:set google__auth='{...}'`).

_Merk også at regnearket med data i må deles med sørvis-kontoens epost-adresse._

`google__spreadsheet`: ID til regnearket med data.
`google__mapsToken`: gir tilgang til Google maps-APIet.

`site__authTokenSecret`: tilfeldig, hemmelig string som brukes til å signere autentiserings-data.

`sms__token`: hemmelighet som gir tilgang til SMS-tilbyders API.

Dette kan også lagres i filene `config/overrides.json` og `config/gsecrets.json` dersom en ikke ønsker å bruke miljøvariabler. Malen for `overrides.json` er slik:

```
{
	"sms": {
		"token": ""
	},
	"site": {
		"authTokenSecret": "",
		"baseUrl": ""
	},
	"google": {
		"spreadsheet": "",
		"mapsToken": ""
	}
}
```

Disse to filene blir ignorert av Git, men blir inkludert når Docker-bilder bygges lokalt.

## Regnearket

_Merk: oppsettet forventer datamodellen Google spreadsheet lager basert på Ila og Bolteløkka skolekorps' skjema for å melde inn loppehenting, pluss følgende ekstra overskrifter som må legges til manuelt: ```status	kvalitet	område	hentesav	admkom	jobnr	koordinater```._

Feltet jobnr brukes internt som en stabil ID for en spesifikk jobb. Det settes til radnummer dersom det ikke er satt manuelt.

Merk at innstillinger i `config/defaults.json` bestemmer hvordan kolonner i regnearket brukes. Dersom appen skal kjøre mot et regneark som har andre kolonner eller en annen rekkefølge, lag en `config/overrides.json` som overstyrer `spreadsheet_columns` - innstillingene.

## Lokal utvikling

Det mest praktiske for lokal utvikling er å kjøre `yarn run autobuild` i en terminal og `node index.js` i en annen. Det kreves selvfølgelig korrekte innstillinger i `config/overrides.json` for å laste data fra et Google docs regneark.

## Utrulling til Scaleway

Scaleway er en skytjeneste som bruker europeiske datasentre i f.eks. Paris og Amsterdam. Det fungerer fint (og er billig!) å kjøre denne tjenesten i Scaleway-skyen som _serverless container_.

For førtse gangs utrulling, må Docker-register, API-tilgang og et navnerom (_namespace_) for _serverless container_ settes opp. Scaleways dokumentasjon og grafiske grensesnitt på [console.scaleway.com](https://console.scaleway.com) hjelper en med dette, så det er ikke dokumentert her.

For å rulle ut til Scaleway, kan en bruke denne framgangsmåten:

1. Docker må være innlogget for å kunne laste opp bilder til Scaleway - se https://console.scaleway.com/registry/namespaces for å sette opp API-tilgang og bruke riktig kommando for å logge Docker inn i et register.

2. Kjør `yarn run scaleway:build` for å bygge et Docker-bilde

3. Kjør `yarn run scaleway:push` for å laste opp bildet til Scaleway

4. Gå til oversikten over _serverless containers_ https://console.scaleway.com/containers/namespaces/ og velg et navnerom (_namespace_).

5. I prikk-menyen for riktig app, velg _Deploy_ for å bruke det nye Docker-bildet.
