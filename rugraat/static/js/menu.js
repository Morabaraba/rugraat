'use strict';
/* global $ _  app */
(function(root) {

	$(menu) // on ready

	function menu() {
		app.util.addMenuItem('Click To Add Test', Menu_addChild)
		// app.util.addMenuItem(app.state.menu.menuIcon + ' Hide Menu', Menu_hideMenu)
	}

	function Menu_hideMenu() {
		app.dispatcher.trigger('js:showMenu', false)
	}

	function Menu_addChild() {
		var newItemConfig = { // https://golden-layout.com/tutorials/dynamically-adding-components.html
			type: 'component',
			componentName: 'example',
			componentState: { 
				text: 'Test',
				class: 'js-example',
			}
		}
		// app.state.layout.example.root.contentItems[0].addChild(newItemConfig) // rather trigger a event to add a new child
		app.dispatcher.trigger('js:GoldenLayout.addChild', { config: newItemConfig, layout: 'layout2' })
	}

})(window)