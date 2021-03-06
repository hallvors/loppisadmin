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

_Merk: oppsettet forventer kolonne-overskriftene Google spreadsheet lager basert på Ila og Bolteløkka skolekorps' skjema for å melde inn loppehenting, pluss følgende ekstra overskrifter som må legges til manuelt: ```status	kvalitet	koordinater	hentesav	admkom	jobnr```._

_Merk: kolonne `jobnr` bør fylles ut i regnearket. Admin-UI vil vise jobbnummer for alle jobber selv om feltet er tomt, men henter-UI vil ikke vise noe dersom feltet er tomt._

`site__authTokenSecret`: tilfeldig, hemmelig string som brukes til å signere autentiserings-data.

`sms__token`: hemmelighet som gir tilgang til SMS-tilbyders API.
