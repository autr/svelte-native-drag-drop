import { writable } from 'svelte/store';


function dragdrop() {

	const { subscribe, set, update } = writable({});

	function findAncestor (el, attr) {
	    while ((el = el.parentElement) && !el.getAttribute( attr ));
	    return el;
	}
	function check( group ) {
		update( d => {
			if (!d[group]) d[group] = { handles: new Map(), drops: [], source: null, destination: null, callbacks: new Map(), dragging: false }
			return d
		})
	}
	const reject = e => console.error('[draggable] ❌  no group ID provided...')

	const dropHandlers = {
		dragover: (e) => {
			const el = findAncestor(e.target, 'data-group')
			const group = el.getAttribute('data-group')
			if (!group) return reject()
			e.preventDefault()
			let cb
			update( d => {
				cb = d[group].callbacks.get( el )
				d[group].destination = el 
				return d 
			})
			if (cb?.dragover) cb.dragover(e)
		},
		dragleave: (e) => {
			const el = findAncestor(e.target, 'data-group')
			const group = el.getAttribute('data-group')
			if (!group) return reject()
			e.preventDefault()
			let cb
			update( d => { 
				cb = d[group].callbacks.get( el )
				d[group].destination = null 
				return d 
			})
			if (cb?.dragleave) cb.dragleave(e)
		},
		drop: (e, t) => {
			const el = findAncestor(e.target, 'data-group')
			const group = el.getAttribute('data-group')
			if (!group) return reject()
			e.preventDefault()
			let cb
			update( d => { 
				cb = d[group].callbacks.get( el )
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
		drop.setAttribute('data-group', group)
		update( d => {
			d[group].callbacks.set( drop, callbacks )
			d[group].drops.push( drop )
			return d 
		})
		for (const [type, method] of Object.entries(dropHandlers)) drop.addEventListener( type, method )
	}
	
	const disable = (e) => {
		const group = e.target.getAttribute('data-group')
		if (!group) return reject()
		update( d => {
			d[group].dragging = false
			d[group].source = e.target
			return d 
		})
		e.target.setAttribute('draggable', false)
	}

	const enable = (e) => {
		const group = e.target.getAttribute('data-group')
		if (!group) return reject()
		let element
		update( d => { 
			d[group].dragging = true
			element = d[group].handles.get( e.target )
			d[group].source = element
			return d
		})
		element.setAttribute('draggable', true)
	}
	
	function addDragArea( group, handle, element ) {
		
		if (!group) return reject()
		check(group)
		element.addEventListener('dragend', disable)
		element.addEventListener('mouseup', disable)
		element.setAttribute('data-group', group)
		handle.setAttribute( 'data-group', group)
		handle.setAttribute( 'data-element', element)
		handle.addEventListener('mousedown', enable)
		
		update( d => { d[group].handles.set( handle, element ); return d })
	}

	function isDragging( group ) {
		if (!group) return reject()
		check(group)
		let b
		update( d => { 
			b = d[group].dragging
			return d
		})
		return b
	}
	
	function clear( group ) {

		if (!group) return reject()

		try {
			update( d => { 

				if (!d[group]) return d

				for (const [handle, element] of Object.entries( d[group].handles)) {
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
				
				delete d[group]
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
		isDragging,
		clear
	}
}

export default dragdrop()