<script>
import { SIZE_BIG, SIZE_MEDIUM, SIZE_SMALL } from '../config';
  export let jobs;
  export let cols = {};
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  const icons = {
    [SIZE_BIG]: '/images/bigcar.png',
    [SIZE_MEDIUM]: '/images/smallcar.png',
    [SIZE_SMALL]: '/images/box.png',
  };
  const redIcons = {
    [SIZE_BIG]: '/images/bigcar-selected.png',
    [SIZE_MEDIUM]: '/images/smallcar-selected.png',
    [SIZE_SMALL]: '/images/box-selected.png',

  }
let container;
  const defaultCenter = { lat: 59.926846, lng: 10.740805 }
let map;
let markers = [];
  import { onMount } from 'svelte';

    onMount(async () => {
      map = new window.google.maps.Map(container, {
              zoom: 13,
        center: defaultCenter,
      });
      window.google.maps.event.addListener(
       map,
      'bounds_changed',
      e => {
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        dispatch('boundschange', {bounds: [[ne.lat(), ne.lng()], [sw.lat(), sw.lng()]]});
      },
    );
});

jobs.subscribe(data => {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers.length = 0;
  for(let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item[cols.COORDS]) {
          console.log('oops, no coords - ' + item[cols.ADDRESS])
          continue;
        }
        const position=item[cols.COORDS].split(',');
        const marker = new window.google.maps.Marker({
          position: {
            lat: parseFloat(position[0]),
            lng: parseFloat(position[1])
          },
          map,
          title: item[cols.ADDRESS],
          label: '★'.repeat(parseInt(item[cols.QUALITY]) + 1),
          icon: {
            url: (item.selected ? redIcons : icons)[item[cols.SIZE]],
            scaledSize: {width: 24, height: 16},
            labelOrigin: {x: 5, y: 25},
          }
      });
      marker.addListener('click', function(evt) {
        dispatch('select', {
          jobnr: item[cols.JOBNR],
          selected: !item.selected
        });
      });
      markers.push(marker);
      }
})


</script>

  <style>
    .map-parent {
        width: 100%;
        height: 100%;
    }
    </style>

<div class="map-parent" bind:this={container}></div>