# Loppisadmin

Nettside for å ha oversikt over, oppdatere og fordele jobber når lopper skal hentes.

Hente-administrator kan kontakte givere (pr SMS) og sende utvalgte jobber til hentere (pr SMS).

Hentere kan oppdatere status på jobbene til "Hentes", "Hentet" (eller sette den tilbake til "Ny" om de ikke rekker over jobben).

Data hentes fra og lagres i et regneark på Google docs. Backend kjører på Node.js, frontend er basert på Svelte.

## Oppsett

Følgende miljøvariabler må settes i Heroku:

`google__auth`: JSON-data fra autentiseringsfil for Google "service account". Lastes ned fra https://console.developers.google.com/ . Fjern linjeskift fra JSON-fil om den skal legges til via kommando-linje (`heroku config:set google__auth='{...}'`). 

_Merk også at regnearket med data i må deles med sørvis-kontoens epost-adresse._

`google__spreadsheet`: ID til regnearket med data.

`site__authTokenSecret`: tilfeldig, hemmelig string som brukes til å signere autentiserings-data.

`sms__token`: hemmelighet som gir tilgang til SMS-tilbyders API.
