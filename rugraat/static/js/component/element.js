'use strict';
/* global $ _ app */
(function(root) {

	_.extend(app.component, { 
		ElementComponent : ElementComponent,
	})

	function ElementComponent(container, state) { 
		var $el = container.getElement()
		var $elState = $(state.$el)
		$el.html('')
		$elState.appendTo($el)
		$elState.show()
		if (state.dispatch) { 
			container.layoutManager.on( 'stackCreated', function( stack ){
				app.dispatcher.trigger(state.dispatch)
			})
		}
		if (state.class)
			$el.addClass(state.class)
	}

})(window)