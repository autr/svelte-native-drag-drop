<script>
	import { onMount, onDestroy } from 'svelte';
	import dragdrop from './index.js'
	
	let elements = []
	let handles = []
	let drops = []

	onMount( async () => {
		for( let i = 0; i < elements.length ; i++ ) {
			
			const handle = handles[i]
			const element = elements[i]
			const drop = drops[i]
			const callbacks = { drop: onDrop }

			dragdrop.addDragArea( 'rainbow', handle, element )
			dragdrop.addDropArea( 'rainbow', drop, callbacks )
		}
	})

	onDestroy( async () => {
		dragdrop.clear('rainbow')
	})

	function onDrop(e) {
		const idxA = drops.indexOf( e.destination )
		const idxB = elements.indexOf( e.source )
		if ( idxA == -1 || idxB == -1 ) return
		const a = list[idxA], b = list[idxB];  
		list[idxB] = a;
		list[idxA] = b;
	}
	
	$: isCurrentDestination = drop => {
		return drop == $dragdrop['rainbow']?.destination
	}
	
	let list = [
		["tomato","One"],
		["violet","Two"],
		["bisque","Three"],
		["hotpink","Four"],
		["aquamarine","Five"],
		["deepskyblue","Six"],
		["springgreen","Seven"]
	]
	
</script>
<div class="bg">
	
{#each list as item, i}
	<div 
		id={ item[0] }
		bind:this={ drops[i] } 
		class:active={ isCurrentDestination( drops[i] ) } 
		class="drop" />
	<div 
		id={ item[1] }
		bind:this={ elements[i] } 
		style="background:{item[0]}">
		<div bind:this={ handles[i] }>{item[1]}</div>
	</div>
{/each}

</div>

<style>
.bg {
	background-image: repeating-linear-gradient(-45deg,black,black 5%,white 0,white 50%,black 0);	
	background-size: 0.8rem 0.8em;
	padding: 2em 2em
}
* {
	padding: 0.5em 2em;
	border: 1px solid purple;
	margin: 0em 0em;
	color: white;
	position: relative;
}
.drop {
	opacity: 0.2;
	background: black;
	z-index: 9999
}
.drop.active {
	background: red;
	opacity: 0.8;
}
</style>