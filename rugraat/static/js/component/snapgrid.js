/* global $ _ Slick Backbone moment palette app */
(function() {

	_.extend(app.component, { 
		SnapGridComponent : SnapGridComponent,
		SnapTextEditor : SnapTextEditor,
	})



	function SnapGridComponent(container, state) {
		var self = this
		var instanceName = state.name || 'snapgrid'
		app.state.snapgrid[instanceName] = this
		this._instanceName = instanceName
		this._container = container
		this._state = state
		this._grid = null

		this._collection = new(Backbone.Collection.extend({
			url: this._state.url
		}))()

		this._$menuDiv = $('<div class="snapgrid-menu">').appendTo(this._container.getElement())
		this._$gridDiv = $('<div class="snapgrid-grid">').appendTo(this._container.getElement())

		this._$counterEl = $('<span class="snapgrid-counter">&nbsp&nbspSelect:&nbsp&nbsp</span>').appendTo(this._$menuDiv)

		this._$groupSelect = $('<span class="snapgrid-select"></span>').appendTo(this._$menuDiv)

		this._$refreshBtn = $('<button title="Refresh">🔄</button>').
		on('click', function() {
			self._fetchData()
		}).
		appendTo(this._$menuDiv)
		if (!this._state.url) {
			this._$refreshBtn.hide()
		}

		this._$cancelRefreshBtn = $('<button title="Cancel Refresh" disabled>🚫</button>').
		on('click', function() {
			self._cancelFetchData()

		}).
		appendTo(this._$menuDiv)
		this._$cancelRefreshBtn.hide()
		
		this._$downloadDataBtn = $('<button title="Download CSV">📥</button>').
		on('click', function() {
			self._downloadData()
		}).
		appendTo(this._$menuDiv)

		this._$filterInput = $('<input class="snapgrid-filter-by" placeholder=" filter by...">').
		on('input', function() {
			self._dataView.refresh()
		}).
		appendTo(this._$menuDiv)

		this._$resetFilterInputBtn = $('<button title="Reset Filter By">❌</button>').
		on('click', function() {
			self._$filterInput.val('')
			self._refresh()
		}).
		appendTo(this._$menuDiv)

		self._headerRowVisisble = false // TODO use this._grid to keep state if header row is open
		this._$columnFilterBtn = $('<button title="Filter By Column">&#x1f50d</button>').
		on('click', function() {
			self._headerRowVisisble = !self._headerRowVisisble
			self._grid.setHeaderRowVisibility(self._headerRowVisisble)
			// self._resetAllFilters()
			self._dataView.refresh()
			return false // do not bubble event
		}).
		appendTo(this._$menuDiv)

		this._$qryDialog = $('<div>')
		this._$qryBuilder = false // only create once dialog is open // $('<div>').appendTo(this._$qryDialog)

		this._$qryBtn = $('<button title="Filter By Query">&#9783</button>').appendTo(this._$menuDiv)
		this._$qryBtn.on('click', function() {
			var instance = self._$qryDialog.dialog("instance")
			if (!instance) {
				self._$qryDialog.dialog({
					title: 'filter by query',
					width: 660,
					height: 200,
					position: {
						my: "left top",
						at: "right bottom",
						of: self._$qryBtn
					},
				})
				if (!self._$qryBuilder) {
					self._createQueryBuilder()
				}
			}
			else {
				var isOpen = self._$qryDialog.dialog("isOpen")
				if (isOpen) {
					self._$qryDialog.dialog("close")
				}
				else {
					self._$qryDialog.dialog("open")
				}

			}
			self._refresh()
		})

		var dupCheckShowHtml = '<button title="Show Duplicates">Show Duplicates</button>'
		var dupCheckAllHtml = '<button title="Show All">Show All</button>'
		this._$duplicateCheckBtn = $('<span style="display: none">' + dupCheckShowHtml + '</span>').
		on('click', function() {
			self._startRefreshAnim()
			setTimeout(function() {
				var showDuplicates = !self._$duplicateCheckBtn.data('showDuplicates')
				self._$duplicateCheckBtn.data('showDuplicates', showDuplicates)
				if (showDuplicates) {
					self._duplicateCheck()
					self._setDuplicateFilter()
				} else {
					self._setDefaultFilters()
				}
				
				self._refresh()
				self._stopRefreshAnim()
				if (showDuplicates) {
					self._$duplicateCheckBtn.html(dupCheckAllHtml)
				} else {
					self._$duplicateCheckBtn.html(dupCheckShowHtml)
				}
				
			}, 50)
			
		}).
		appendTo(this._$menuDiv)
		this._$duplicateCheckBtn.data('showDuplicates', false)
		
		this._dataView = new Slick.Data.DataView()

		this._columns = state.columns || []
		this._rawColumns = this._columns

		this._columnFilters = {
			// used for the header column filters
		}

		this._options = {
			editable: true,
			enableAddRow: true,
			enableCellNavigation: true,
			asyncEditorLoading: false,
			autoEdit: false,
			//dataItemColumnValueExtractor: getVal,
			//dataItemColumnValueSetter: setVal
			showHeaderRow: true,
			explicitInitialization: true,
		}

		this._queryBuilderOptions = {
			rules: {
				"condition": "AND",
				"rules": [{
					"id": "Reference",
					"field": "Reference",
					"operator": "contains",
				}]
			},
			filters: [],
			conditions: ['AND']
		}

		container.on('open', this._scheduleGridCreation, this)
	}



	SnapGridComponent.prototype._cancelFetchData = function() {
		var self = this
		if (self._fetchXhr) {
			var tmpXhr = self._fetchXhr
			self._fetchXhr = undefined
			// Stop pending fetch https://stackoverflow.com/a/12899286
			if (tmpXhr.readyState > 0 && tmpXhr.readyState < 4) {
				tmpXhr.abort()
			}
		}
	}



	SnapGridComponent.prototype._fetchData = function() {
		var self = this
		if (self._fetchXhr) {
			self._cancelFetchData()
		}
		self._fetchXhr = self._collection.fetch()
		//self._collection.set(self._columns)
		//self._fetchXhr = self._collection.save()
		//self._fetchXhr = self._collection.fetch({
		//	type: 'POST',
		//	contentType: 'application/json',
		//	data: JSON.stringify(self._rawColumns)
		//})
	}



	SnapGridComponent.prototype._setData = function() {
		var self = this
		var options = {}
		self._collection.trigger('sync', self._collection, self._state.data , options)
	}



	SnapGridComponent.prototype._resetAllFilters = function() {
		var $headerRow = $(this._grid.getHeaderRow())
		$headerRow.find('input').val('')
		$headerRow.find('.js-daterangepicker').daterangepicker('clearRange')
		this._columnFilters = {}
	}



	SnapGridComponent.prototype._stopRefreshAnim = function() {
		var self = this
		self._$refreshBtn.find('i').removeClass('gly-spin')
		self._$refreshBtn.attr('disabled', false)
		self._$cancelRefreshBtn.attr('disabled', true).removeClass('btn-danger').addClass('btn-inverse')
	}



	SnapGridComponent.prototype._startRefreshAnim = function() {
		var self = this
		self._$refreshBtn.find('i').addClass('gly-spin')
		self._$refreshBtn.attr('disabled', true)
		self._$cancelRefreshBtn.attr('disabled', false).removeClass('btn-inverse').addClass('btn-danger')
	}



	SnapGridComponent.prototype._setDefaultFilters = function() {
		var self = this
		self._dataView.setFilter(self._chainFilters(self._createdDateFilter, self._inputFilter, self._columnFilter, self._queryBuilderFilter))
		
	}



	SnapGridComponent.prototype._setDuplicateFilter = function() {
		var self = this
		//self._dataView.setFilter(self._chainFilters(self._duplicateFilter))
		self._dataView.setFilter(self._chainFilters(self._createdDateFilter, self._inputFilter, self._columnFilter, self._queryBuilderFilter, self._duplicateFilter))
	}



	SnapGridComponent.prototype._setupCollection = function() {
		var self = this
		this._collection.on('request', function() {
			self._startRefreshAnim()
		})

		this._collection.on('error', function(collection, response, options) {
			if (options.textStatus == 'parsererror') {
				self._state.data = app.util.CSV2JSON(response.responseText)
				self._setData()
				self._stopRefreshAnim()
				return
			}
			self._stopRefreshAnim()
			if (self._fetchXhr) {
				alert('Could not fetch grid data for ' + self._instanceName)
			}
			else {
				//alert('canceled loading grid data')
			}
		})

		this._collection.on('sync', function(collection, data, options) {
			if (!self._columns || self._columns.length === 0) {
				self._columns = self._generateColumns(data)
			}

			self._dataView.beginUpdate()
			try {
			self._dataView.setItems(data)
			} catch(error) {
				if (error.message.indexOf("implement a unique 'id' property") > -1) {
					_.each(data, function(item, index, arr) { item['id'] = index});
					self._dataView.setItems(data)
				}
			}
			self._setDefaultFilters()
			//self._setDuplicateFilter()
			self._dataView.endUpdate()

			self._setCounter()
			self._createGrid()
			
			self._stopRefreshAnim()

		})
		if (this._collection.url) {
			this._fetchData()
		}
		else if (this._state.data) {
			this._setData()
		}
		else {
			
		}
	}



	/**
	 * This method is used to get around a chrome-bug that manifests itself when using popout windows with Slickgrid
	 * in Codepens.
	 *
	 * SlickGrid appends a custom style element to the head section and checks for its presence using the document.styleSheets property.
	 * This seems to cause a number of issues (https://github.com/mleibman/SlickGrid/issues/223). 
	 * 
	 * The specific problem here is, that when opening a new popout window, GoldenLayout moves all link elements from
	 * the body to the head section (links are in the body in Codepens). Chrome only updates its document.styleSheets array once
	 * these stylesheets have been loaded - which is correct.
	 *
	 * What isn't correct is, that Chrome defers adding the styletag - which doesn't need loading - to the document.styleSheets array until
	 * all dynamically added link elements are loaded.
	 *
	 * To recap: this will happen if all of these conditions are true
	 *
	 * - Have link elements in body instead of head
	 * - Use SlickGrid - I've never seen anything else access the document.styleSheets array
	 * - Open Popout window - only then does GoldenLayout move link tags around
	 *
	 * The work-around is to defer SlickGrid's initialisation until all stylesheets have been loaded - which can be checked
	 * by attaching event listeners  to the link tag's "load event" or - to make sure that we don't miss a stylesheet that has
	 * already been loaded - poll the link elements sheet property
	 */
	SnapGridComponent.prototype._scheduleGridCreation = function() {
		var self = this
		var interval = setInterval(function() {
			var stylesheetNodes = $('link[rel=stylesheet]'),
				i
			for (i = 0; i < stylesheetNodes.length; i++) {
				if (stylesheetNodes[i].sheet === null) {
					return
				}
			}
			clearInterval(interval) // creation code below this line ==================

			//this._onMountFilterHeader()
			this._setupCollection()

			// creation code end 
		}.bind(this), 10)
	}



	SnapGridComponent.prototype._onMountFilterHeader = function() {
		var self = this
		$.onmount('.slick-header .slick-header-column:first-child', function() {
			var $self = $(this)
			self._headerRowVisisble = true

			function filterClick() {
				self._headerRowVisisble = !self._headerRowVisisble
				self._grid.setHeaderRowVisibility(self._headerRowVisisble)

				self._columnFilters = {}
				self._dataView.refresh()

				return false // do not bubble event
			}

			$self.children(':first-child').html('&#x1f50d')

			$self.off('click')
			$self.on('click', filterClick)
		})
	}



	SnapGridComponent.prototype._addChartDataCountingKey = function(chartId, countingKey, formatKeyAsMoment) {
		var self = this
		var fItems = this._dataView.getFilteredItems()
		var countData = {}
		//HACK
		var avgAmount = {}
		var avgAge = {}

		_.each(fItems, function(row) {
			var k = (row[countingKey] || '')
			if (k == '') {
				return
			}
			
			if (formatKeyAsMoment) {
				k = self._guessMoment(k).format(formatKeyAsMoment)
			}
			if (!countData[k]) {
				countData[k] = 1
			}
			else {
				countData[k] = countData[k] + 1
			}

			function addAmount(row, key, amountKey) {
				if (key.toLowerCase() == amountKey.toLowerCase()) {
					var keyAmount = Number(row[key])
					if (_.isNaN(keyAmount)) {
						keyAmount = row[key]
						if (_.isString(keyAmount)) {
							keyAmount = Number(keyAmount.replace(/[^0-9.]/g, ''))
						}
						if (_.isNaN(keyAmount)) {
							keyAmount = 0
						}
					}
					return keyAmount
				}
				return 0
			}

			var conAmount = 0
			_.each( _.keys(row), function(key) {
				var amountKey = app.state.snapgrid[self._instanceName].avgAmountField || 'contract_amount'
				if( _.isArray(amountKey)) {
					_.each(amountKey, function(ak) {
						conAmount += addAmount(row, key, ak)
					})
				} else {
					conAmount += addAmount(row, key, amountKey)
				}
			})

			if (!avgAmount[k]) avgAmount[k] = 0
			avgAmount[k] = avgAmount[k] + conAmount
			
			if (!row['date_of_birth']) {
				return
			}
			
			var dob = self._guessMoment(row['date_of_birth'])
			if (dob.isValid()) {
				var y = Math.floor(moment(new Date()).diff(dob, 'years', true))
				if (!avgAge[k]) avgAge[k] = 0
				if (y > 0) avgAge[k] = avgAge[k] + y
			}

		})
		var layout = this._container.layoutManager
		var dataCountChart = layout.root.getItemsById(chartId)[0]
		if (!dataCountChart) { 
			console.error('Could not find chart layout item by id ' + chartId)
			return countData
		}
		dataCountChart.instance.removeData()

		var keys = _.keys(countData)
		if (keys.length == 0) {
			var sumGrid = layout.root.getItemsById(chartId + '_grid')
			if (sumGrid && sumGrid.length > 0) {
				sumGrid[0].instance._dataView.setItems([])
			}
			return countData
		}
		var backgroundColors = palette(['tol', 'mpn65'], keys.length)

		if (backgroundColors) {
			backgroundColors = backgroundColors.map(function(hex) {
				return '#' + hex
			})
		}

		if (self._guessMoment(keys[0]).isValid()) {
			keys = _.sortBy(keys, function(o) {
				return self._guessMoment(o).valueOf()
			})
		}
		else {
			keys = _.sortBy(keys)
		}

		_.each(keys, function(k, i, items) {
			var color = backgroundColors ? backgroundColors[i] : app.util.getRandomColor()
			dataCountChart.instance.addData(app.util.toPascalCase(k), countData[k], color)
		})

		sumGrid = layout.root.getItemsById(chartId + '_grid')
		if (sumGrid && sumGrid.length > 0) {
			var countSumRows = []
			_.each(_.keys(countData), function(key, i) {
				countSumRows.push({
					'id': i,
					'name': app.util.toPascalCase(key),
					'count': countData[key],
					'total_amount': avgAmount[key].toFixed(2),
					'avg_amount': (avgAmount[key] / countData[key]).toFixed(2),
					'avg_age': (avgAge[key] / countData[key]).toFixed(0),
				})
			})
			sumGrid[0].instance._dataView.setItems([])
			sumGrid[0].instance._dataView.setItems(countSumRows)
		}
		return countData
	}



	SnapGridComponent.prototype._setCounter = function() {
		var cLength = this._dataView.getLength()
		var aLength = this._dataView.getItems().length
		if (cLength != aLength) {
			cLength = '<span class="label label-default js-filter-length">' + cLength + '</span>'
		}
		this._$counterEl.html('&nbsp&nbsp' + cLength + ' of ' + aLength + '&nbsp&nbsp')
		if (this._state.counterChart) this._addChartDataCountingKey((this._state.counterChart.id || this._state.counterChart.contentItemId), this._state.counterChart.columnId)
	}



	SnapGridComponent.prototype._generateColumns = function(rows, formatter) {
		var columns = [/*{
			id: "selector",
			name: "",
			field: "selector",
			width: 30,
		}*/]

		var keys = Object.keys(rows[0])
		if (keys) {
			keys.forEach(function(key) {
				var name = key.replace('_', ' ')
				name = app.util.toPascalCase(name)
				var c = {
					id: key,
					name: name,
					field: key,
					formatter: formatter,
					width: 60,
					editor: Slick.Editors.Text,
					sortable: true 
				}
				columns.push(c)
			})
		}
		return columns
	}



	SnapGridComponent.prototype._extendColumns = function() {
		var self = this
		var instanceName = self._instanceName
		app.state.snapgrid[instanceName].colors_for_hash = {}
		app.state.snapgrid[instanceName].filteringDuplicates = false
		
		function DuplicateFilterFormatter(row, cell, value, columnDef, dataContext) {
			if (!dataContext) return '-'
		if (columnDef._formatter && columnDef._formatter !== DuplicateFilterFormatter) {
				value = columnDef._formatter(row, cell, value, columnDef, dataContext)
			}
			var style = ''
			
			if (app.state.snapgrid[instanceName]._$duplicateCheckBtn.data('showDuplicates')) {
				if (dataContext._color_hash) {
					var color = app.state.snapgrid[instanceName].colors_for_hash[dataContext._color_hash]
					style = 'background: ' + color + ''
				}
				
				if (_.contains( dataContext._highlight_columns, columnDef.id)) {
					style = style + 'font-weight: bold'
				}
			}
			if (!value) {
				value = '&nbsp'
			}
			if (value.trim && (value.trim() === '')) {
				value = '&nbsp'
			}
			return '<div style="' + style + '">' + value + '</div>'
		}
		
		_.each(this._columns, function(c) {
			var name = c.name.replace('_', ' ')
			name = app.util.toPascalCase(name)
			c.name = name
			//c.editor = Slick.Editors.Text
			c.editor = app.component.SnapTextEditor
			if (c.formatter) {
				c._formatter = c.formatter
			}
			c.formatter = DuplicateFilterFormatter
			/*
			id: key,
					name: name,
					field: key,
					formatter: formatter,
					width: 60,
			*/
		})
		
		self._duplicateFilterOnColumns = self._getDuplicateFilterOnColumns()
		
		if (self._duplicateFilterOnColumns['OR'].length == 0 && self._duplicateFilterOnColumns['AND'].length == 0) {
			self._$duplicateCheckBtn.hide()
		} else {
			self._$duplicateCheckBtn.show()
		}

	}



	SnapGridComponent.prototype._refresh = function() {
		this._dataView.refresh()
	}



	SnapGridComponent.prototype._createGrid = function() {
		var self = this

		this._extendColumns() // add editor and other styling to columns
		this._grid = new Slick.Grid(
			this._$gridDiv,
			this._dataView,
			this._columns,
			this._options
		)

		this._grid.onHeaderRowCellRendered.subscribe(function(e, args) {
			var $container = $(args.node)
			$container.empty()

			var filterValue = self._columnFilters[args.column.id]
			var $input = $('<input type="text" class=""  placeholder="" />').data("columnId", args.column.id).val(filterValue).appendTo($container)
			if (args.column.id.indexOf('date') >= 0) {
				$input.addClass('js-daterangepicker')
				$input.dateRangePicker({})
				/*({
					datepickerOptions: {
						minDate: null,
						maxDate: null
					},
					initialText: '&nbsp'
				})*/
			}

			var itemsObj = {}
			var columnId = args.column.id
			_.each(self._dataView.getItems(), function(row) {
				var item = row[columnId]
				if (!item) return
				if (!itemsObj[item]) itemsObj[item] = 0
				itemsObj[item] = itemsObj[item] + 1
			})
			var items = []
			_.each(_.keys(itemsObj), function(k) {
				items.push({
					label: k + ' (' + itemsObj[k] + ')',
					value: k
				})
			})

			$input.on('focus', function() {
				$input.autocomplete("search", "")
			})

			$input.autocomplete({
				source: items,
				minLength: 0
			})

			$input.on("autocompleteselect", function(event, ui) {
				self._columnFilters[columnId] = ui.item.value
				self._dataView.refresh()
			})
		})

		// Subscribe to the grid's onSort event.
		this._grid.onSort.subscribe(function(e, args) {

			// It only gets fired for sortable columns, so make sure your column definition has `sortable = true`.

			// args.multiColumnSort indicates whether or not this is a multi-column sort.
			// If it is, args.sortCols will have an array of {sortCol:..., sortAsc:...} objects.
			// If not, the sort column and direction will be in args.sortCol & args.sortAsc.

			// We'll use a simple comparer function here.
			var comparer = function(a, b) {
				var v1 = a[args.sortCol.field]
				var v2 = b[args.sortCol.field]
				if (!_.isNaN(Number(v1))) v1 = Number(v1)
				if (!_.isNaN(Number(v2))) v2 = Number(v2)
				return (v1 > v2) ? 1 : -1
			}

			// Delegate the sorting to DataView.
			// This will fire the change events and update the grid.
			self._dataView.sort(comparer, args.sortAsc)
		})

		this._grid.init()

		$(this._grid.getHeaderRow()).delegate(":input", "change keyup", function(e) {
			var columnId = $(this).data("columnId")
			if (columnId != null) {
				var v = $(this).val()
				if (_.isString(v)) {
					v = $.trim(v)
				}
				self._columnFilters[columnId] = v
				self._dataView.refresh()
			}
		})

		// Make the grid respond to DataView change events.
		this._dataView.onRowCountChanged.subscribe(function(e, args) {
			self._grid.updateRowCount()
			self._grid.render()
			self._setCounter.call(self)
		})

		this._dataView.onRowsChanged.subscribe(function(e, args) {
			self._grid.invalidateRows(args.rows)
			self._grid.render()
			self._setCounter()
		})

		this._container.on('resize', this._resize, this)
		this._container.on('destroy', this._destroy, this)

		self._grid.setHeaderRowVisibility(self._headerRowVisisble)

		var $uiBackground = $(this._container._element.find('.lm_content').children()[1])
		$uiBackground.css('background-color', 'transparent')

		this._resize()
	}


	SnapGridComponent.prototype._createQueryBuilder = function() {
		var self = this
		self._$qryBuilder = $('<div>').appendTo(self._$qryDialog)
		// qry builder
		this._columns.forEach(function(col) {
			self._queryBuilderOptions.filters.push({
				id: col.id,
				label: col.name,
				type: 'string',
				operators: ['contains', 'not_contains']
			})
		})
		// this._queryBuilderOptions.plugins =  ['bt-tooltip-errors'] TODO
		this._queryBuilderOptions.allow_groups = false

		self._$qryBuilder._oldRules = null
		self._$qryBuilder._oldOldRules = null
		this._$qryBuilder.queryBuilder(this._queryBuilderOptions).on('rulesChanged.queryBuilder', function(event) {
			var $dialog = self._$qryDialog
			var $queryBuilder = self._$qryBuilder
			var h = $queryBuilder.height() + 80 // + dialog heading and padding
			$dialog.dialog("option", "height", h)
		})

		/*
		this._$qryBuilder.queryBuilder().on('changer:getRuleInput', function(event) {
			console.log('changer:getRuleInput', arguments)	
		})
		
		this._$qryBuilder.queryBuilder().on('changer:getRuleInput.queryBuilder', function(event) {
			console.log('changer:getRuleInput', arguments)	
		})
		//getRuleInput
		this._$qryBuilder.queryBuilder().on('queryBuilder:getRuleInput', function(event) {
			console.log('changer:getRuleInput', arguments)	
		})
		*/

		this._$qryBuilder.queryBuilder().on('rulesChanged.queryBuilder', function(event) {
			//var $dialog = self._$qryDialog
			var $queryBuilder = self._$qryBuilder

			var newRules = $queryBuilder.queryBuilder('getRules')
			var sameRules = _.isEqual(newRules, $queryBuilder._oldRules)

			$queryBuilder._oldOldRules = $queryBuilder._oldRules
			$queryBuilder._oldRules = newRules
			if (sameRules) {
				return
			}
			self._dataView.refresh()
		})
	}


	SnapGridComponent.prototype._resize = function() {

		this._$gridDiv.height($(this._container.getElement()).height() - this._$menuDiv.height())
		this._grid.resizeCanvas()
		this._grid.autosizeColumns()
	}


	SnapGridComponent.prototype._downloadData = function() {
		//var json_pre = '[{"Id":1,"UserName":"Sam Smith"},{"Id":2,"UserName":"Fred Frankly"},{"Id":1,"UserName":"Zachary Zupers"}]'
		//var json = $.parseJSON(json_pre)
		var data = this._dataView.getFilteredItems()

		var csv = app.util.JSON2CSV(data)
		var downloadLink = document.createElement("a")
		var blob = new Blob(["﻿", csv])
		var url = URL.createObjectURL(blob)
		downloadLink.href = url
		downloadLink.download = "data-" + moment().format('YYYYMMDD') + ".csv"

		document.body.appendChild(downloadLink)
		downloadLink.click()
		document.body.removeChild(downloadLink)
	}

	SnapGridComponent.prototype._destroy = function() {
		this._grid.destroy()
	}


	SnapGridComponent.prototype._inputFilter = function(item, args) {
		var j = JSON.stringify(_.values(item)).toLowerCase()
		return j.indexOf(this._$filterInput.val().toLowerCase()) == -1 ? false : true
	}

	SnapGridComponent.prototype._guessMoment = function(dateToGuess, strict) {
		var self = this
		if (_.isUndefined(strict)) strict = true
		var guesses = [
				"YYYY/MM/DD", "YYYY-MM-DD", 
				"DD/MM/YYYY", "DD-MM-YYYY", 
				"MM/DD/YYYY", "MM-DD-YYYY"
				]
		
		var guess = guesses.shift() // shift like pop but only from the front of the array
		var v = moment(String(dateToGuess), guess, strict)
		if (v.isValid()) return v
		
		while (guesses.length > 0 ) {
			guess = guesses.shift()
			v = moment(String(dateToGuess), guess, strict)
			if (v.isValid()) return v
		}
		if (strict === false) return v
		return self._guessMoment(dateToGuess, false)
	}

	SnapGridComponent.prototype._compareMoment = function(f, item, c) {
		if (!f) return true
		var self = this
		
		if (f.indexOf) {
			if (f.indexOf('"start"') >= 0 && f.indexOf('"end"') >= 0) { // might be a moment object
				var fo = JSON.parse(f)
				fo.start = self._guessMoment(fo.start)
				fo.end = self._guessMoment(fo.end)
				var v = self._guessMoment(item[c.field])
				if (fo.start === fo.end) {
					return v.isSame(fo.start)
				}
				return v.isBetween(fo.start, fo.end) || v.isSame(fo.start) || v.isSame(fo.end)
			}
		}
		return false
	}


	SnapGridComponent.prototype._createdDateFilter = function(item) {
		var self = this
		var c = {
			field: app.state.snapgrid[self._instanceName].filterDateField
		}
		var f = self._columnFilters[c.field]
		if (f === "") return true
		if (self._compareMoment(f, item, c)) return true
		return false
	}

	SnapGridComponent.prototype._getDuplicateFilterOnColumns = function(item) {
		var self = this
		var _duplicateFilterOnColumns = { 'OR': [] , 'AND': [] }
		_.each(self._columns, function(col) {
		if (col.filter_duplicate) {
			if ( col.filter_duplicate_operator && col.filter_duplicate_operator.toUpperCase() == 'OR') {
				_duplicateFilterOnColumns['OR'].push( col)
			} else if (col.filter_duplicate_operator && col.filter_duplicate_operator.toUpperCase() == 'AND') {
				_duplicateFilterOnColumns['AND'].push( col)
			} else {
				_duplicateFilterOnColumns['AND'].push( col) // DEFAULT TO AND
			}
		}
		})
		return _duplicateFilterOnColumns
	}
	
	SnapGridComponent.prototype._duplicateCheck = function(item) {
		var self = this
		
		if (!self._duplicateFilterOnColumns) {
			self._duplicateFilterOnColumns = self._getDuplicateFilterOnColumns()
		}
		
		if (self._duplicateFilterOnColumns['OR'].length == 0 && self._duplicateFilterOnColumns['AND'].length == 0) {
			return // no columns to check
		}
		
		
		function highlightColumn(triggered, o, item, dupCol) {
			//if (_.isEqual(o, item) ) {
			if (o == item ) {
				return
			}
			if (triggered) {
				o._highlight_columns = o._highlight_columns || []
				if (!_.contains(o._highlight_columns, dupCol.id ) )
					o._highlight_columns.push(dupCol.id)
				
				item._highlight_columns = item._highlight_columns || []
				if (!_.contains(item._highlight_columns, dupCol.id ) )
					item._highlight_columns.push(dupCol.id)
				
			}
		}
		
		var items = self._dataView.getItems()
		_.each( items, function(item) {
			
			var found = _.filter(items, function(o) { 
				var result = true
				_.each( self._duplicateFilterOnColumns['AND'], function(dupCol) {
					//if (o[dupCol.id] == item[dupCol.id]) result = true
					if (item[dupCol.id] == '') return
					var triggered = (o[dupCol.id] == item[dupCol.id])
					highlightColumn(triggered, o, item, dupCol)
					result = result &&  triggered
					
				})
				if (!result) {
					return result // short-circuit if the AND return false
				}
				if (self._duplicateFilterOnColumns['OR'].length == 0) {
					return result
				}
				result = false
				_.each( self._duplicateFilterOnColumns['OR'], function(dupCol) {
					//if (o[dupCol.id] == item[dupCol.id]) result = true
					if (item[dupCol.id] == '') return
					var triggered = (o[dupCol.id] == item[dupCol.id])
					highlightColumn(triggered, o, item, dupCol)
					result = result || triggered
					
				})
				
				return result
			})
			item._duplicate = found.length > 1
			if (item._duplicate) {
				
				var color_hash = ''
				_.each(self._duplicateFilterOnColumns['OR'], function(dupCol) {
					color_hash += item[dupCol.id]
				})
				_.each(self._duplicateFilterOnColumns['AND'], function(dupCol) {
					color_hash += item[dupCol.id]
				})
				
				item._color_hash = color_hash
				app.state.snapgrid[self._instanceName].colors_for_hash[color_hash] = 'white'
			}
			
		})
		
		var keys = Object.keys(app.state.snapgrid[self._instanceName].colors_for_hash)
		//var backgroundColors = palette(['tol', 'mpn65'], keys.length)
		_.each(keys, function(k, i) {
			app.state.snapgrid[self._instanceName].colors_for_hash[k] = app.util.getRandomColor()
		})
	}
	
	SnapGridComponent.prototype._duplicateFilter = function(item) {
		var result = item._duplicate ? true : false
		return result
	}


	SnapGridComponent.prototype._columnFilter = function(item) {
		var self = this

		if (!self._headerRowVisisble) return true // only filter if header visible

		for (var columnId in self._columnFilters) {
			if (columnId !== undefined && self._columnFilters[columnId] !== "") {
				var c = self._grid.getColumns()[self._grid.getColumnIndex(columnId)]
				var f = self._columnFilters[columnId]

				if (self._compareMoment(f, item, c)) return true

				if (f.toLowerCase) f = f.toLowerCase()
				var v = item[c.field]

				if (_.isUndefined(v)) {
					var instanceName = self._instanceName
					var colIndex = app.state.snapgrid[instanceName]._grid.getColumnIndex(c.id)
					var columns = app.state.snapgrid[instanceName]._grid.getColumns()
					if (columns[colIndex] && columns[colIndex].formatter) {
						var colDef = columns[colIndex]
						v = colDef.formatter(0, 0, v, colDef, item)
					}
				}
				v = String(v)

				if (v.toLowerCase) v = v.toLowerCase()
				if (v.indexOf(f) == -1) {
					return false
				}
			}
		}
		return true
	}


	SnapGridComponent.prototype._chainFilters = function() {
		var self = this
		var chain = []

		function fnFilterChain(item, args) {
			for (var i = chain.length; i--;) {
				var fn = chain[i]
				if (!fn.call(self, item, args)) {
					return false
				}
			}
			return true
		}

		function pushToChain() {
			_.each(arguments, function(fn) {
				if (_.isArray(fn)) {
					pushToChain.apply(this, fn)
					return
				}
				else if (!_.isFunction(fn)) {
					console.error(fn, 'must be a function to be a filter')
					return
				}
				chain.push(fn)
			})
		}
		pushToChain.apply(this, arguments)
		return fnFilterChain
	}


	SnapGridComponent.prototype._queryBuilderFilter = function(item, args) {
		var self = this
		var instanceName = self._instanceName
		if (!self._$qryBuilder) return true


		if (!self._$qryDialog.dialog("isOpen")) { // dont use this filter while dialog closed
			return true
		}

		var rules = self._$qryBuilder.queryBuilder('getRules')

		if (!rules) return true // no rules return valid

		var result = true

		// TODO add more rule levels only using first as and
		rules.rules.forEach(function(rule) {
			if (!result) return // ugly hack to end loop TODO use for i.
			var itemValue = item[rule.id]

			if (_.isUndefined(itemValue)) {
				var colIndex = app.state.snapgrid[instanceName]._grid.getColumnIndex(rule.id)
				var columns = app.state.snapgrid[instanceName]._grid.getColumns()
				if (columns[colIndex] && columns[colIndex].formatter) {
					var colDef = columns[colIndex]
					itemValue = colDef.formatter(0, 0, itemValue, colDef, item)
				}
			}


			itemValue = String(itemValue).toLowerCase()

			var ruleValue = rule.value.toLowerCase()
			var ruleOp = rule.operator
			switch (ruleOp) {
				case 'equal':
					if (ruleValue != itemValue) {
						result = false
					}
					break
				case 'not_equal':
					if (ruleValue == itemValue) {
						result = false
					}
					break
				case 'contains':
					if (itemValue.indexOf(ruleValue) == -1) {
						result = false
					}
					break
				case 'not_contains':
					if (itemValue.indexOf(ruleValue) != -1) {
						result = false
					}
					break
				default:
					console.log('default op, do nothing')
					break
			}

		})
		return result
	}


	function SnapTextEditor(args) {
		var $input
		var defaultValue
		var scope = this
	
		this.init = function () {
			$input = $("<INPUT type=text class='editor-text' />")
				.appendTo(args.container)
				.on("keydown.nav", function (e) {
					if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
						e.stopImmediatePropagation()
					}
				})
				.focus()
				.select()
		}
	
		this.destroy = function () {
			$input.remove()
		}
	
		this.focus = function () {
			$input.focus()
		}
	
		this.getValue = function () {
			return $input.val()
		}
	
		this.setValue = function (val) {
			$input.val(val)
		}
	
		this.loadValue = function (item) {
			defaultValue = item[args.column.field] || ""
			if (args.column.htmlTemplate) {
				var row = '',
					cell = '',
					value = defaultValue,
					columnDef = args.column,
					dataContext = item,
					defaultValue = app.formatters.HtmlTemplateFormatter(row, cell, value, columnDef, dataContext) 
			}
			$input.val(defaultValue)
			$input[0].defaultValue = defaultValue
			$input.select()
		}
	
		this.serializeValue = function () {
			return $input.val()
		}
	
		this.applyValue = function (item, state) {
			item[args.column.field] = state
		}
	
		this.isValueChanged = function () {
			return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue)
		}
	
		this.validate = function () {
			if (args.column.validator) {
				var validationResults = args.column.validator($input.val())
				if (!validationResults.valid) {
					return validationResults
				}
			}
			
			return {
				valid: true,
				msg: null
			}
		}
	
		this.init()
	}

})()
