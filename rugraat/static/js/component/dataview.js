/* global $ _ app Slick Backbone moment ace*/
(function(root) {

	_.extend(app.component, { 
		DataViewGridComponent: DataViewGridComponent,
	})

	function CollectionFormatter(row, cell, value, columnDef, dataContext) {
		if (!value) {
			value = dataContext.get(columnDef.id)
		}
		if (columnDef.name == 'Created') {
			var mom = new moment.unix(value / 1000)
			return mom.format('HH:mm:ss') + " <small>" + mom.fromNow() + '</small>'
		}

		if (columnDef.id == 'ace') {
			function createAceEditor() {
				var element = $('.js-ace-editor')[0]
				var editor = ace.edit(element, {
					mode: "ace/mode/javascript",
					selectionStyle: "text"
				})
				app.editor = editor

				$('.slick-header').addClass('hidden')
				var $gridElement = $(dataContext.collection.component._container.getElement())
				var $gridCanvas = $gridElement.find('.grid-canvas')

				var $cell = $gridElement.find('.slick-cell')
				var $viewport = $gridElement.find('.slick-viewport')
				var newHeight = $gridElement.parent().height()

				$viewport.css('overflow', 'hidden')
				$viewport.height(newHeight)
				$cell.css('padding', '0px')
				$gridCanvas.height(newHeight)
				$cell.height(newHeight)
				$(element).height(newHeight)
			}
			//setTimeout(createAceEditor, 10)
			value = JSON.stringify(value, null, 4)
			var r = "<div class='js-ace-editor'>" + value + "</div>"
			return r
		}
		// pass options to ace.edit
		if (_.isObject(value)) {
			return JSON.stringify(value)
		}
		return value
	}

	function DataViewGridComponent(container, state) {
		this._container = container
		this._state = state
		this._grid = null
		this._collection = state.collection || new Backbone.Collection.extend({
			comparator: function(m) {
				return -m.get('date').getTime()
			}
		})
		this._collection.component = this
		this._dataView = new Slick.Data.DataView()
		this._columns = state.columns || []

		function addColumnOption(columnName) {
			var c = {
				sortable: true,
				id: columnName,
				name: app.utils.toPascalCase(columnName.replace('_', ' ')),
				field: columnName,
				formatter: CollectionFormatter
			}
			columnsOptions.push(c)
		}

		var columnsOptions = []
		
		if (this._columns.length == 0) {
			if (!this._collection.models) {
				console.error('No state columns or collection model defined. Cannot create grid columns.')
				return
			}
			var model = this._collection.models[0]
			_.each(_.keys(model.attributes), addColumnOption)
		}
		else {
			_.each(this._columns, addColumnOption)
		}
		this._columnsOptions = columnsOptions
		this._gridOptions = state.gridOptions || {
			editable: true,
			enableAddRow: true,
			enableCellNavigation: true,
			asyncEditorLoading: false,
			autoEdit: false,
			//dataItemColumnValueExtractor: getVal,
			//dataItemColumnValueSetter: setVal
			//showHeaderRow: true,
			explicitInitialization: true,
		}
		container.on('open', this._scheduleGridCreation, this)
	}

	DataViewGridComponent.prototype._setDataView = function() {
		this._dataView.setItems(this._collection.models) // pass the raw access backbone array to slickgrid dataview
		this._refresh()
	}

	DataViewGridComponent.prototype._scheduleGridCreation = function() {
		var interval = setInterval(function() {
			var stylesheetNodes = $('link[rel=stylesheet]'),
				i
			for (i = 0;i < stylesheetNodes.length;i++) {
				if (stylesheetNodes[i].sheet === null) {
					return
				}
			}
			clearInterval(interval)
			this._createGrid()
		}.bind(this), 10)
	}

	DataViewGridComponent.prototype._setupCollection = function() {
		var self = this
		this._collection.on('add', function() {
			self._refresh()
		})
	}

	DataViewGridComponent.prototype._createGrid = function() {
		var self = this
		this._grid = new Slick.Grid(
			this._container.getElement(),
			this._dataView,
			this._columnsOptions,
			this._options
		)

		this._container.on('resize', this._resize, this)
		this._container.on('destroy', this._destroy, this)
		/*
		// Subscribe to the grid's onSort event.
		// It only gets fired for sortable columns, so make sure your column definition has `sortable = true`.
		this._grid.onSort.subscribe(function(e, args) {
		// args.multiColumnSort indicates whether or not this is a multi-column sort.
		// If it is, args.sortCols will have an array of {sortCol:..., sortAsc:...} objects.
		// If not, the sort column and direction will be in args.sortCol & args.sortAsc.
		
		// We'll use a simple comparer function here.
		var comparer = function(a, b) {
		return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1
		}
		
		// Delegate the sorting to DataView.
		// This will fire the change events and update the grid.
		self._dataView.sort(comparer, args.sortAsc)
		})
		*/
		this._grid.init()

		// Make the grid respond to DataView change events.
		this._dataView.onRowCountChanged.subscribe(function(e, args) {
			self._grid.updateRowCount()
			self._grid.render()
		})

		this._dataView.onRowsChanged.subscribe(function(e, args) {
			self._grid.invalidateRows(args.rows)
			self._grid.render()
		})

		this._setupCollection()
		this._setDataView()

		this._resize()
	}

	DataViewGridComponent.prototype._refresh = function() {
		this._dataView.refresh()
	}

	DataViewGridComponent.prototype._resize = function() {
		this._grid.resizeCanvas()
		this._grid.autosizeColumns()
	}

	DataViewGridComponent.prototype._destroy = function() {
		this._grid.destroy()
	}

})(window)