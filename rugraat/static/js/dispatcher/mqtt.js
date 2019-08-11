'use strict';
/* global $ _ Backbone GoldenLayout Paho app*/
(function(root) {
	app.dispatcher.on('js:Paho.Client.Create', Paho_Client_Create)
	app.dispatcher.on('js:mqtt.sendMessage', sendMessage)
	app.state.mqtt = {}
	
	function Paho_Client_Create(opts) {
		opts = opts || {}
		var subscribeToTopic = opts.topic || "World"
		var clientId = opts.clientId || ("cid-" + app.util.uuidv4().split('-')[1])
		var instanceName = opts.name || 'client'
		var brokerIndex = opts.mqttBrokerIndex || 0
		var mqttBrokers = opts.mqttBrokers || [ // https://github.com/mqtt/mqtt.github.io/wiki/public_brokers
			{
				hostname: "planeteer.mooo.com",
				port: 15675,
				path: '/ws',
				ssl: false,
				username: 'rugraat',
				password: 'rugraat',				
			},
			{
				hostname: 'iot.eclipse.org',
				port: 443,
				path: '/ws',
				ssl: true
			},
			{
				hostname: 'test.mosquitto.org',
				port: 443,
				path: '/mqtt',
				ssl: true
			},
			{
				hostname: 'broker.hivemq.com',
				port: 8000,
				path: '/ws',
				ssl: true
			},
			
			
			{
				hostname: 'mqtt.dioty.co', // requires signup/username and password
				port: 8880,
				path: '/ws',
				ssl: true
			},
			{
				hostname: 'mqtt.fluux.io', 
				port: 8883,
				path: '/ws',
				ssl: true
			},
			
		]
		// Create a client instance
		function createInstance() {
			var client = new Paho.Client(mqttBrokers[brokerIndex].hostname, Number(mqttBrokers[brokerIndex].port), mqttBrokers[brokerIndex].path || '/mqtt', clientId)
			//var client = new Paho.Client('wss://iot.eclipse.org:443/ws', clientId)
			//var client = new Paho.Client('wss://broker.hivemq.com:443/ws', clientId)
			//var client = new Paho.Client('wss://mqtt.lazyengineers.com:8883/mqtt', clientId)
			//var client = Paho.Client("iot.eclipse.org", Number(443), "/ws", clientId)
			//var client = new Paho.Client("planeteer.mooo.com", Number(15675), "/ws", clientId)
			if (app.state.mqtt[instanceName]) {
				var oldClient = app.state.mqtt[instanceName]
				//oldClient.disconnect()
			}
			app.state.mqtt[instanceName] = client
			// set callback handlers
			client.onConnectionLost = onConnectionLost
			client.onMessageArrived = onMessageArrived
			client.cnt = 0 // tick counter
			return client
		}
		
		var client = createInstance()
		// connect the client
		client.connect({ 
			userName: mqttBrokers[brokerIndex].username,
			password: mqttBrokers[brokerIndex].password,
			onSuccess: onConnect, 
			useSSL: mqttBrokers[brokerIndex].ssl,
			
			keepAliveInterval: 30, 
			reconnect : true,         // Enable automatic reconnect
			//reconnectInterval: 10     // Reconnect attempt interval : 10 seconds

		})

		// called when the client connects
		function onConnect() {
			// Once a connection has been made, make a subscription and send a message.
			console.log("onConnect")
			client.subscribe(subscribeToTopic)
			client.subscribe('alive')
			var $nick = $('[name="root[Nickname]"]') // HACK
			var msg = {
				n: $nick.val(),
				m: 'Hello '
			}
			sendMessage(JSON.stringify(msg))
			client.tickId = setInterval(tickMessage, 60 * 1000)
		}

		// called when the client loses its connection
		function onConnectionLost(responseObject) {
			console.log("Lost connection to " + responseObject.uri + "\nError code: " + responseObject.errorCode + "\nError text: " + responseObject.errorMessage)
			if (responseObject.reconnect) {
				console.log("Automatic reconnect is currently active.")
			} else {
				console.error("Lost connection to host.")
			}
		}

		// called when a message arrives
		function onMessageArrived(message) {
			console.log("onMessageArrived:" + message.payloadString)
			app.dispatcher.trigger('js:mqtt.receiveMessage', message.payloadString)
		}
	}

	function sendMessage(msg, destTopic, instanceName) {
		destTopic = destTopic || "World"
		instanceName = instanceName || 'client'
		var client = app.state.mqtt[instanceName]
		var message = new Paho.Message(msg)
		message.destinationName = destTopic
		client.send(message)
	}

	function tickMessage() {
		var instanceName =  'client'
		var client = app.state.mqtt[instanceName]
		var msg = { 'c': client.cnt , 't': (+ new Date()), 'n': app.state.editor.chat.$nick.val() /* HACK */ }
		app.dispatcher.trigger('js:mqtt.sendMessage', JSON.stringify(msg))
		client.cnt = client.cnt + 1
	}
})(window)
