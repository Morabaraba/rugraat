'use strict';
/* global $ _ app StockDataProvider Backbone */
(function(root) {
	$(main) // on ready call main
	function main() {

		var all_symbols = [
			"III", "ADN", "ADM", "AGK", "AAL", "ANTO",
			"ARM", "AHT", "ABF", "AZN", "AV", "BAB",
			"BA", "BARC", "BDEV", "BG", "BLT", "BP",
			"BATS", "BLND", "BSY", "BT.A", "BNZL",
			"BRBY", "CPI", "CCL", "CNA", "CCH",
			"CPG", "CRH", "DGE", "EZJ", "EXPN",
			"FRES", "FLG", "GFS", "GKN", "GSK",
			"GLEN", "HMSO", "HL", "HSBA", "IMI", "IMT",
			"IHG", "IAG", "ITRK", "INTU", "ITV", "JMAT"
		]
		var currentStockData = (function() {
			var stock = (new StockDataProvider()).getStocksBySymbol(all_symbols)
			_.each(stock, function(row, index, collection) {
				row['id'] = index // add a unique id for each row
			})
			return stock
		})()
		var stockCollection = new(Backbone.Collection.extend({ /*url: '/stock' */ }))();
		stockCollection.set(currentStockData)
		
		var config0 = {
			content: [{
				type: 'row',
				content: [{
					title: 'SnapGrid',
					type: 'component',
					componentName: 'snapgrid',
					componentState: {
						//data: currentStockData,
						//url: '/rugraat/static/data/u64q_bulkdata.csv',
						
						url: '/rugraat/static/data/29-Mar-2018-u64q-n.csv',
						fetchType: 'GET',
						counterChart: {
							contentItemId: 'chart',
							columnId: 'price'
						}
					}
				}, ]
			}]
		}

		var config1 = {
			content: [{
				type: 'row',
				content: [{
						title: 'Chat',
						type: 'component',
						componentName: 'chat',
						componentState: {}
					},
					{
						type: 'column',
						content: [{
								title: 'SnapGrid',
								type: 'component',
								componentName: 'snapgrid',
								componentState: {
									//data: currentStockData,
									url: '/rugraat/static/data/MOCK_DATA.csv',
									fetchType: 'GET',
									counterChart: {
										contentItemId: 'chart',
										columnId: 'gender'
									}
								}
							},
							{
								id: 'chart',
								title: 'Chart.js',
								type: 'component',
								componentName: 'chart',
								componentState: {
									//text: 'Component 1',
									//class: 'js-example',
								}
							},
						]
					},
					{
						type: 'column',
						content: [{
								id: 'chart_grid',
								type: 'component',
								title: 'Chart Summary',
								componentName: 'snapgrid',
								componentState: {
									data: [ {
										'id': '',
										'name': '',
										'count': '',
										'total_amount': '',
										'avg_amount': '',
										'avg_age': '',
									}]
								}
							},
							{
								type: 'component',
								title: 'DataView',
								componentName: 'dataview',
								componentState: {
									//collection: stockCollection
								}
							},
						]
					},

					{
						title: 'Snap FTSE 100 (1-50)',
						type: 'component',
						componentName: 'snapgrid',
						componentState: {
							data: currentStockData
						}
					}
				]
			}]
		}

		var i = app.util.getUrlParameter('i')
		if (i) {
			i = Number(i)
			app.state.layout.layoutCount = i
			console.log('layout count = ' + i)
			if (i >= 2) var config2 = {
				content: [{
					type: 'row',
					content: [{
						title: 'JSON Editor',
						type: 'component',
						componentName: 'editor',
						componentState: {}
					}, ]
				}]
			}
			if (i >= 3) var config3 = {
				content: [{
					type: 'row',
					content: [{
						title: 'Snap FTSE 100 (1-50)',
						type: 'component',
						componentName: 'snapgrid',
						componentState: {
							data: currentStockData
						}
					}]
				}]
			}
			if (i >= 4) var config4 = {
				content: [{
					type: 'row',
					content: [{
						title: 'Web Video Player',
						type: 'component',
						componentName: 'vplayer',
						componentState: {
							$el: '#js-vplayer',
						}
					}, ]
				}]
			}
			app.dispatcher.trigger('js:GoldenLayout.Create', { config: config0 })
			/*
			if (i == 1) app.dispatcher.trigger('js:GoldenLayout.Create', { config: config1 })
			else app.dispatcher.trigger('js:GoldenLayout.Create', { name: 'layout1', $elId: '#layout1', config: config1 })
			if (i >= 2) app.dispatcher.trigger('js:GoldenLayout.Create', { name: 'layout2', $elId: '#layout2', config: config2 })
			if (i >= 3) app.dispatcher.trigger('js:GoldenLayout.Create', { name: 'layout3', $elId: '#layout3', config: config3 })
			if (i >= 4) app.dispatcher.trigger('js:GoldenLayout.Create', { name: 'layout4', $elId: '#layout4', config: config4 })
			*/
		}
		else { // just one master layout
			app.state.layout.layoutCount = 1
			app.dispatcher.trigger('js:GoldenLayout.Create', { config: config0 })
		}

		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { component: app.component.ExampleComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'element', component: app.component.ElementComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'chart', component: app.component.ChartComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'snapgrid', component: app.component.SnapGridComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'stockgrid', component: app.component.StockGridComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'dataview', component: app.component.DataViewGridComponent })
		
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'vplayer', component: app.component.VPlayerComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'editor', component: app.component.EditorComponent })
		app.dispatcher.trigger('js:GoldenLayout.registerComponent', { name: 'chat', component: app.component.ChatComponent })

		app.dispatcher.trigger('js:GoldenLayout.init')

		app.dispatcher.trigger('js:hideMenu', true)

		app.dispatcher.trigger('js:Paho.Client.Create')

		app.util.setupDocumentKeypressEvents() // should we do this with a trigger?
	}
})(window)