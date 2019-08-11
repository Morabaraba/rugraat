'use strict';
/* global $ _ Chart app */
(function(root) {

	_.extend(app.component, { 
		ChartComponent : ChartComponent,
	})

	//var ChartComponent = function(container, state) { // https://scotch.io/tutorials/understanding-hoisting-in-javascript
	
	/**
	 * Represents a Chart.js Goldenlayout Component
	 * @constructor
	 * @param {object} container - https://golden-layout.com/docs/Container.html
	 * @param {object} state - pojo containing Component state
	 */
	function ChartComponent(container, state) {
		this._container = container
		this._canvas = document.createElement("canvas")
		$(this._canvas).addClass("chart-component-canvas")

		this._elem = this._container.getElement()
		this._elem[0].appendChild(this._canvas)
		this._state = state
		container.on('open', this._scheduleCreation, this)
	}

	ChartComponent.prototype.addData = function(label, data, color) {

		if (_.findIndex(this._chart.data.labels, label) != -1) {
			console.log('found ' + label + 'ignore data point')
			return
		}

		this._chart.data.labels.push(label)
		this._chart.data.datasets.forEach(function(dataset) {
			dataset.data.push(data)
			if (color) {
				if (!dataset.backgroundColor) dataset.backgroundColor = []
				dataset.backgroundColor.push(color)
			}
		})
		this._chart.update()
	}

	ChartComponent.prototype.removeData = function() {
		this._chart.data.labels = []
		this._chart.data.datasets.forEach(function(dataset) {
			dataset.data = []
			dataset.backgroundColor = []
		})
		this._chart.update()
	}

	ChartComponent.prototype._scheduleCreation = function() {
		this._ctx = this._canvas.getContext('2d')
		this._options = this._state.options || {
			type: 'horizontalBar',
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: '',
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				}
			}
		}
		this._chart = new Chart(this._ctx, this._options)
	}

})(window)