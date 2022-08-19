# Loppisadmin

![Skjemdump av nettside](https://github.com/hallvors/loppisadmin/blob/master/docs/images/overview.png?raw=true)

Nettside for å ha oversikt over, oppdatere og fordele jobber når lopper skal hentes.

Hente-administrator kan kontakte givere (pr SMS) og sende utvalgte jobber til hentere (pr SMS).

Hentere kan oppdatere status på jobbene til "Hentes", "Hentet" (eller sette den tilbake til "Ny" om de ikke rekker over jobben). Flere detaljer om bruk av systemet finnes i [Loppisadmin wiki](https://github.com/hallvors/loppisadmin/wiki).

Data hentes fra og lagres i et regneark på Google docs. Backend kjører på Node.js, frontend er basert på Svelte.

## Oppsett

Følgende miljøvariabler må settes i Heroku:

`google__auth`: JSON-data fra autentiseringsfil for Google "service account". Lastes ned fra https://console.developers.google.com/ . Fjern linjeskift fra JSON-fil om den skal legges til via kommando-linje (`heroku config:set google__auth='{...}'`).

_Merk også at regnearket med data i må deles med sørvis-kontoens epost-adresse._

`google__spreadsheet`: ID til regnearket med data.

`site__authTokenSecret`: tilfeldig, hemmelig string som brukes til å signere autentiserings-data.

`sms__token`: hemmelighet som gir tilgang til SMS-tilbyders API.

## Regnearket

_Merk: oppsettet forventer datamodellen Google spreadsheet lager basert på Ila og Bolteløkka skolekorps' skjema for å melde inn loppehenting, pluss følgende ekstra overskrifter som må legges til manuelt: ```status	kvalitet	område	hentesav	admkom	jobnr```._

Feltet jobnr brukes internt som en stabil ID for en spesifikk jobb. Det settes til radnummer dersom det ikke er satt manuelt.

Merk at innstillinger i `config/defaults.json` bestemmer hvordan kolonner i regnearket brukes. Dersom appen skal kjøre mot et regneark som har andre kolonner eller en annen rekkefølge, lag en `config/overrides.json` som overstyrer `spreadsheet_columns` - innstillingene.

## Lokal utvikling

Det mest praktiske for lokal utvikling er å kjøre `yarn run autobuild` i en terminal og `node server.js` i en annen. Det kreves selvfølgelig korrekte innstillinger i `config/overrides.json` for å laste data fra et Google docs regneark.
