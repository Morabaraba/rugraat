'use strict';
/* global $ _ app crypto Howl JSONEditor*/
(function(root) {

	app.dispatcher.on('js:addMenuItem', addMenuItem)
	app.dispatcher.on('js:showMenu', showMenu)
	app.dispatcher.on('js:hideMenu', hideMenu)

	_.extend(app.state, {
		menu: {
			menuIcon: '☰',
			$elId: '#menuContainer',
			$showBtn: null,
			elName: 'li', // type element of menu item
		},
		layout: {
			$elId: '#layoutContainer',
			background: 'WhiteSmoke',
			color: '#090909',
		}
	})

	_.extend(app.util, { 
		uuidv4: uuidv4,
		addMenuItem: addMenuItem,
		setupDocumentKeypressEvents: setupDocumentKeypressEvents,
		playIntroSound: playIntroSound,
		toPascalCase: toPascalCase,
		createJsonEditor: createJsonEditor,
		createJsonEditorWithSchema: createJsonEditorWithSchema,
		getUrlParameter: getUrlParameter,
		JSON2CSV: JSON2CSV,
		CSV2JSON: CSV2JSON,
		getRandomColor: getRandomColor
	})

	function uuidv4() {
		if (crypto) // https://stackoverflow.com/a/2117523
			return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
				(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
			)
		else
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0,
					v = c == 'x' ? r : (r & 0x3 | 0x8)
				return v.toString(16)
			})
	}

	function addMenuItem(text, onClick) {
		var elName = app.state.menu.elName || 'li'
		var element = $('<' + elName + '>' + text + '</' + elName + '>')
		element.click(onClick)
		$(app.state.menu.$elId).append(element)
	}

	function showMenu(show) {
		var $menu = $(app.state.menu.$elId)
		var $layout = $(app.state.layout.$elId)
		if (show) {
			$menu.show()
			$layout.css('width', '90%')
			$layout.css('left', '10%')
		} else {
			$menu.hide()
			$layout.css('width', '100%')
			$layout.css('left', '0')
		}
		/* refresh all layouts in our state */
		layoutsUpdateSize()
		/* must we show a btn to make the menu visible again */
		app.state.menu.$showBtn = app.state.menu.$showBtn || $('<div class="js-menuIcon">' + app.state.menu.menuIcon + '<span class="js-title"> ctrl+m or tap to show menu</span></div>')
		var $showBtn = app.state.menu.$showBtn
		$showBtn.off()
		$showBtn.click(function() {
			$showBtn.find('.js-title').hide()
			app.dispatcher.trigger('js:showMenu', !show)
		})
		if (show) {
			$showBtn.css('color', app.state.layout.background)
			$showBtn.attr('title', 'Hide Menu')
		} else {
			$showBtn.css('color', app.state.layout.color)
			$showBtn.attr('title', 'Show Menu')
		}
		$showBtn.appendTo('body')
		setTimeout(function() {
			var $el = $showBtn.find('.js-title')//.hide()
			$el.fadeOut()
		}, 6333 ) // timeout our title after 6 seconds
	}
	
	function hideMenu(show) {
		showMenu(!show)
	}

	function layoutsUpdateSize() {
		_.each( _.keys(app.state.layout), function(instanceName) {
			var layout = app.state.layout[instanceName]
			if (layout && layout.updateSize) layout.updateSize()
		})
	}

	function fullscreenChange(e) {
		if (!root.screenTop && !root.screenY) {
			console.log('not fullscreen')
		} else {
			console.log('fullscreen')
		}
		layoutsUpdateSize()
	}

	function setupDocumentKeypressEvents() {
		// Detect F11 keypress because it does not fire a "fullscreenchange" event - https://stackoverflow.com/a/21118401
		document.addEventListener("keydown", function( event ) { 
			if (event.key == "F11") {
				setTimeout(fullscreenChange, 100)  // give the browser 100 ms before we update our layout size
				//event.preventDefault() 
			}
		})
		// Ctrl+M for Menu hotkey
		$(document).keypress(function( event ) {
			if ( event.ctrlKey && event.code === "KeyM" ) {
				var $menu = $(app.state.menu.$elId)
				showMenu(!$menu.is(':visible'))
				event.preventDefault()
			}
		})
		// detect requestFullScreen event - https://stackoverflow.com/a/21767854
		$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', fullscreenChange)
	}

	function playIntroSound() {
		var src = /* 'sound/Electronic_Chime-KevanGC-495939803.mp3' */ '/rugraat/static/sound/Electronic_Chime-KevanGC-495939803.mp3'
		var counter = 0
		var sound = new Howl({
			src: [src],
			autoplay: true,
			loop: false,
			volume: 0.044,
			onend: function() {
				counter++
				if (counter > 2) {
					sound.stop()
				}
				console.log('Finished!')
			}
		})
	}

	function toPascalCase(str) {
		return str.replace(/\w\S*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
		})
	}


	function createJsonEditor($el, name) {
		var $editor = $('<div class="js-json-editor">').appendTo($el)

		var options = {
			theme: 'bootstrap3',
			disable_properties: true,
			disable_edit_json: true,
			disable_collapse: true
		}
		$.extend(JSONEditor.defaults.options, options)

		var schema = {
			type: "object",
			properties: {
				"Dummy Prop": { "type": "string" },
			}
		}

		var dataSchema = $el.attr('data-schema')

		if (dataSchema) {
			$.get(dataSchema, function(data) {
				createJsonEditorWithSchema($editor, data)
			})
		} else {
			createJsonEditorWithSchema($editor, schema)
		}
	}

	function createJsonEditorWithSchema($el, schema) {
			// Initialize the editor
			var editor = new JSONEditor($el[0],
				{
				  schema: schema
				}
			)
			editor.on('ready',function() {
				var v = $el.val()
				if (v) {
					v= JSON.parse(v)
					$.each(Object.keys(editor.schema.properties), function(key) { // make sure we do not drop keys that was attached to our new schema
						if (!v[key]) {
							v[key] = ''
						}
					})
					editor.setValue(
						v
					)
				}
			})

			editor.on('change',function() {
				var v = editor.getValue()
				v = JSON.stringify(v)
				$el.val(v)
			})
			
			return editor
		}

	function getUrlParameter(sParam) { // https://stackoverflow.com/a/21903119
		var sPageURL = window.location.search.substring(1),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i
	
		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=')
	
			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1])
			}
		}
	}

	/* https://stackoverflow.com/a/24643992 */
	function JSON2CSV(objArray, objOpts) {
		var options = objOpts || {
			showHeader: true,
			quoteText: true
		}
		var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray
		var str = ''
		var line = ''
		
		if (options.showHeader) {
			var head = array[0]
			if (options.quoteText) {
				for (var index in array[0]) {
					var value = index + ""
					line += '"' + value.replace(/"/g, '""') + '",'
				}
			}
			else {
				for (var index in array[0]) {
					line += index + ','
				}
			}

			line = line.slice(0, -1)
			str += line + '\r\n'
		}

		for (var i = 0; i < array.length; i++) {
			var line = ''

			if (options.quoteText) {
				for (var index in array[i]) {
					var value = array[i][index] + ""
					line += '"' + value.replace(/"/g, '""') + '",'
				}
			}
			else {
				for (var index in array[i]) {
					line += array[i][index] + ','
				}
			}

			line = line.slice(0, -1)
			str += line + '\r\n'
		}
		return str
	}

	// var csv is the CSV file with headers
	function CSV2JSON(csv, stringify) { // https://stackoverflow.com/a/27979069
		var lines=csv.split("\n")
		var result = []
		var headers=lines[0].split(",")
		for (var i=1; i < lines.length; i++) {
				var obj = {}
				var currentline = lines[i].split(",")
				for (var j=0; j < headers.length; j++) {
						obj[headers[j]] = currentline[j]
				}
				result.push(obj)
		}
		if (stringify)
			return JSON.stringify(result) //JSON
		return result //JavaScript object
	}

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('')
		var color = '#'
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)]
		}
		return color
	}

})(window)