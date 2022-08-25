import { writable, derived } from "svelte/store";
import { sortByStreet, sortByArea, filter } from "./utils/helpers";

export const drivers = writable([]);
export const jobsData = writable([]);
export const sortBy = writable("street");
export const cols = writable(null);
export const selectedIds = writable([]);

// Job filtering stuff
export const bounds = writable([]);
export const freeTextFilter = writable("");
export const smallActive = writable(true);
export const mediumActive = writable(true);
export const bigActive = writable(true);
export const monActive = writable(true);
export const tueActive = writable(true);
export const wedActive = writable(true);
export const thuActive = writable(true);
export const dayFilterExclusive = writable(false);
export const typeFilter = writable("");
export const qualityFilter = writable("");
export const hideDoneJobs = writable(true);
export const showMap = writable(false);

export const jobs = derived(
  [
    jobsData,
    sortBy,
    cols,
    selectedIds,
    bounds,
    freeTextFilter,
    smallActive,
    mediumActive,
    bigActive,
    tueActive,
    wedActive,
    thuActive,
    dayFilterExclusive,
    typeFilter,
    qualityFilter,
    drivers,
    hideDoneJobs,
	showMap,
  ],
  ([
    $jobsData,
    $sortBy,
    $cols,
    $selectedIds,
    $bounds,
    $freeTextFilter,
    $smallActive,
    $mediumActive,
    $bigActive,
    $tueActive,
    $wedActive,
    $thuActive,
    $dayFilterExclusive,
    $typeFilter,
    $qualityFilter,

    $drivers,
    $hideDoneJobs,
	$showMap,
  ]) => {
    return ($jobsData || [])
      .filter((job) =>
        filter(
          $freeTextFilter,
          {
            smallActive: $smallActive,
            mediumActive: $mediumActive,
            bigActive: $bigActive,
          },
          {
            tueActive: $tueActive,
            wedActive: $wedActive,
            thuActive: $thuActive,
            dayFilterExclusive: $dayFilterExclusive,
          },
          $typeFilter,
          $qualityFilter,
          $hideDoneJobs,
          $drivers,
          job,
          $cols
        )
      )
      .filter((job) => {
		if (!$showMap) {
			return true;
		}
        if (!($bounds && $bounds.length === 2)) {
          return true;
        }
        const coords = (job[$cols.COORDS] || "").split(/,/g).map(parseFloat);
        if (!(coords && coords.length === 2)) {
			// needs fixing, show it
          return true;
        }
        return (
          coords[0] < $bounds[0][0] && // NW lat
          coords[0] > $bounds[1][0] && // SE lat
          coords[1] < $bounds[0][1] && // NW lon
          coords[1] > $bounds[1][1] // SE lon
        );
      })
      .sort($sortBy === "street" ? sortByStreet($cols) : sortByArea($cols))
      .map((item) => {
        item.selected = $selectedIds.includes(item[$cols.JOBNR]);
        return item;
      });
  },
  []
);

// contents of drivers are synced to localStorage
if (typeof localStorage !== "undefined") {
  let existingData = localStorage.getItem("drivers");
  if (existingData) {
    drivers.set(JSON.parse(existingData));
  }
  let unsub = drivers.subscribe((data) => {
    localStorage.setItem("drivers", JSON.stringify(data));
  });
}
