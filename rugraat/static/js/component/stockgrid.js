/* global $ _ app Slick StockDataProvider */
(function() {

	_.extend(app.state, {
		snapgrid: {},
	})

	_.extend(app.component, {
		StockGridComponent: StockGridComponent,
	})

	function StockGridComponent(container, state) {
		this._container = container
		this._state = state
		this._grid = null
		this._stockDataProvider = new StockDataProvider()
		this._columns = [
			{ id: "symbol", name: "Symbol", field: "symbol" },
			{ id: "company", name: "Company", field: "company" },
			{ id: "price", name: "Price", field: "price" },
			{ id: "change", name: "Change", field: "change" },
			{ id: "changeRel", name: "Change %", field: "changeRel" },
			{ id: "volume", name: "Volume", field: "volume" }
		]
		this._options = {
			editable: false,
			enableAddRow: false,
			enableCellNavigation: true
		}

		container.on('open', this._scheduleGridCreation, this)
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
	StockGridComponent.prototype._scheduleGridCreation = function() {
		var interval = setInterval(function() {
			var stylesheetNodes = $('link[rel=stylesheet]'),
				i

			for (i = 0; i < stylesheetNodes.length; i++) {
				if (stylesheetNodes[i].sheet === null) {
					return
				}
			}

			clearInterval(interval)
			this._createGrid()

		}.bind(this), 10)
	};

	StockGridComponent.prototype._createGrid = function() {
		this._grid = new Slick.Grid(
			this._container.getElement(),
			this._stockDataProvider.getStocksBySymbol(this._state.symbols),
			this._columns,
			this._options
		);

		this._container.on('resize', this._resize, this)
		this._container.on('destroy', this._destroy, this)
		this._resize()
	};

	StockGridComponent.prototype._resize = function() {
		this._grid.resizeCanvas()
		this._grid.autosizeColumns()
	};

	StockGridComponent.prototype._destroy = function() {
		this._grid.destroy()
	};
	
})(window)