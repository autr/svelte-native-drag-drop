import { writable } from 'svelte/store';


function dragdrop() {

	const { subscribe, set, update } = writable({});
	
	function check( group ) {
		update( d => {
			if (!d[group]) d[group] = { handles: new Map(), drops: [], source: null, destination: null }
			return d
		})
	}
	
	const reject = e => console.error('[draggable] no group ID provided...')

	const dropHandlers = {
		dragover: (e) => {
			const cb = e.target.callbacks
			const group = e.target.group
			e.preventDefault()
			update( d => {(d[group].destination = e.target); return d } )
			if (cb?.dragover) cb.dragover(e)
		},
		dragleave: (e) => {
			const cb = e.target.callbacks
			const group = e.target.group
			e.preventDefault()
			update( d => { (d[group].destination = null); return d } )
			if (cb?.dragleave) cb.dragleave(e)
		},
		drop: (e, t) => {
			const cb = e.target.callbacks
			const group = e.target.group
			e.preventDefault()
			update( d => { 
				if (cb?.drop) cb.drop( { 
					...e, 
					source: d[group].source, 
					destination: d[group].destination 
				})
				d[group].destination = null; 
				return d;
			})
		}
	}
	
	function addDropArea( group, drop, callbacks ) {
		if (!group) return reject()
		check( group )
		drop.group = group
		drop.callbacks = callbacks
		update( d => {(d[group].drops.push( drop )); return d } )
		for (const [type, method] of Object.entries(dropHandlers)) drop.addEventListener( type, method )
	}
	
	const disable = (e) => {
		const group = e.target.group
		update( d => { d[group].source = e.target; return d })
		e.target.setAttribute('draggable', false)
	}

	const enable = (e) => {
		const group = e.target.group
		update( d => { d[group].source = e.target.element; return d } )
		e.target.element.setAttribute('draggable', true)
	}
	
	function addDragArea( group, handle, element ) {
		
		if (!group) return reject()
		check(group)

		element.addEventListener('dragend', disable)
		element.addEventListener('mouseup', disable)
		element.group = group
		handle.group = group
		handle.element = element
		handle.addEventListener('mousedown', enable)
		
		update( d => { d[group].handles.set( handle, element ); return d })
	}
	
	function clear( group ) {

		if (!group) return reject()

		try {
			update( d => { 
				for (const [handle, element] of Object.entries(d[group].handles)) {
					handle.removeEventListener( 'mousedown', enable )
					element.removeEventListener( 'dragend', disable )
					element.removeEventListener( 'mouseup', disable )
				}
				for (let i = 0; i < d[group].drops.length; i++) {
					const drop = d[group].drops[i]
					for (const [type, method] of Object.entries(dropHandlers)) {
						drop.removeEventListener( type, method )
					}
				}
				
				//d[group]; 
				return d 
			})
		} catch(err) {
			console.error(`[dragdrop] could not clear "${group}":`, err.message)
		}
	}
	
	return {
		subscribe,
		set,
		update,
		addDragArea,
		addDropArea,
		clear
	}
}

export default dragdrop();