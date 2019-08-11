'use strict';
/* global _ app */
(function(root) {

	_.extend(app.component, { 
		ExampleComponent : ExampleComponent,
	})

	function ExampleComponent(container, state) { // https://golden-layout.com/tutorials/dynamically-adding-components.html
		var $el = container.getElement()
		if (state.text)
			$el.html('<h2>' + state.text + '</h2>')
		if (state.class)
			$el.addClass(state.class)
	}

})(window)