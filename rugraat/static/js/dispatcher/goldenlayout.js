'use strict';
/* global $ _ GoldenLayout app */
(function(root) {

	app.dispatcher.on('js:GoldenLayout.Create', GoldenLayout_Create)
	app.dispatcher.on('js:GoldenLayout.registerComponent', GoldenLayout_registerComponent)
	app.dispatcher.on('js:GoldenLayout.init', GoldenLayout_init)
	app.dispatcher.on('js:GoldenLayout.addChild', GoldenLayout_addChild)

	app.state.layout = {}

	function GoldenLayout_Create(opts) {
		opts = opts || {}
		var $elId = opts.$elId || app.state.layout.$elId
		var layoutName = opts.name || 'example'
		var config = opts.config || {
			content: [{
				type: 'row',
				content: [{
						type: 'component',
						componentName: 'example',
						componentState: { text: 'Component 1' }
					},
					{
						type: 'component',
						componentName: 'example',
						componentState: { text: 'Component 2' }
					},
					{
						type: 'component',
						componentName: 'example',
						componentState: { text: 'Component 3' }
					}
				]
			}]
		}
		var layout = new GoldenLayout(config, $elId)
		app.state.layout[layoutName] = layout
	}

	function GoldenLayout_registerComponent(opts) {
		opts = opts || {}
		var compFunc = opts.component
		if (!compFunc) throw Error('Register a constructor function needed. Make sure `option.component` is defined.')
		var layoutName = opts.layout || '__all__'
		var compName = opts.name || 'example'
		if (layoutName === '__all__') {
			_.each( _.keys(app.state.layout), function(instanceName) {
				var layout = app.state.layout[instanceName]
				if (layout && layout.registerComponent) layout.registerComponent(compName, compFunc)
			})
		} else {
			var layout = app.state.layout[layoutName]
			layout.registerComponent(compName, compFunc)
		}
	}

	function GoldenLayout_init(opts) {
		opts = opts || {}
		var layoutName = opts.name || '__all__'
		if (layoutName === '__all__') {
			_.each( _.keys(app.state.layout), function(instanceName) {
				var layout = app.state.layout[instanceName]
				if (layout && layout.init) layout.init()
			})
		} else {
			var layout = app.state.layout[layoutName]
			layout.init()
		}
	}

	function GoldenLayout_addChild(opts) {
		opts = opts || {}
		var layoutName = opts.layout || '__all__'
		var config = opts.config
		if (layoutName === '__all__') {
			_.each( _.keys(app.state.layout), function(instanceName) {
				var layout = app.state.layout[instanceName]
				if (layout && layout.root) contentItems_addChild(layout, config)
			})
		} else {
			var layout = app.state.layout[layoutName]
			contentItems_addChild(layout, config)
		}
	}

	function contentItems_addChild(layout, config) {
		var item = layout.root.contentItems[0]
		if (!item) {
			console.log('No item to add config to')
			return
		}
		item.addChild(config)
	}

})(window)