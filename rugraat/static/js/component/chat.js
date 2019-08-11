'use strict';
/* global $ _ app JSONEditor PouchDB */
(function(root) {

	app.dispatcher.on('js:mqtt.receiveMessage', receiveMessage) // hack to get mqtt msg

	_.extend(app.component, { 
		ChatComponent : ChatComponent,
	})

	function ChatComponent(container, state) { 
		var self = this
		var $el = container.getElement()
		self._container = container
		self._name = state.name || 'chat'
		app.state.editor[self._name] = self // add this chat component as a editor instance
		self._$el = $el
		
		container.on('open', this._scheduleCreation, this)
		
		var db = new PouchDB('chat-db-'+ self._name)
		self._db = db
	}
	
	ChatComponent.prototype._scheduleCreation = function() {
		var self = this
		var schema = {
			type: "object",
			properties: {
				"Sound": { "type": "boolean", "format": "checkbox", "default": false },
				"Messages": { "type": "string", "format": "textarea" },
				"Nickname": { "type": "string" },
				"Message": { "type": "string" },
			}
		}

		// TODO non global way to change editors
		var options = {
			theme: 'barebones',
			disable_properties: true,
			disable_edit_json: true,
			disable_collapse: true
		}
		$.extend(JSONEditor.defaults.options, options)

		var editor = app.util.createJsonEditorWithSchema(self._$el , schema)
		self._editor = editor
		
		function restyleEditor(editor) {
			
			var $el = $(editor.element)
			var $h3 = $el.find('h3')
			$h3.siblings().attr('style', '')
			$h3.hide()
		}
		editor.on('ready', function() {
			restyleEditor(editor);
			var $nick = $('[name="root[Nickname]"]')
			var $msg = $('[name="root[Message]"]')
			var sendIcon = '✉'
			var $send = $('<button type="button" title="Send">&nbsp;' + sendIcon + '&nbsp;</button>')
			var $msgs = $('[name="root[Messages]"]')
			var $sound = $('[name="root[Sound]"]')
			function sendClick() {
				var msg = {
					n: $nick.val(),
					m: $msg.val(),
				}
				app.dispatcher.trigger('js:mqtt.sendMessage', JSON.stringify(msg))
				$msg.val('')
			}
			$send.click(sendClick)
			$nick.val('Anon' + app.util.uuidv4().split('-')[1])
			self.$nick = $nick
			/* more styling */
			self._container.on('resize', function() {
				$msgs.height( self._$el.height() - $msgs.offset().top - 32 ) /* x just some padding */
				$msg.width( $('[data-schemapath="root.Nickname"]').width() - 120 - 38 ) /* x just some padding */
			})
			$msgs.height( self._$el.height() - $msgs.offset().top - 32 ) /* x just some padding */
			$msgs.siblings('label').hide()
			$sound.parent().html('Play Message Alert').prepend($sound)
			$nick.parent().html('').append($nick)
			$msg.parent().html(':').append($msg)
			$msg.parent().appendTo($nick.parent())
			$nick.width('120px')
			$msg.width( $('[data-schemapath="root.Nickname"]').width() - 120 - 38 ) /* x just some padding */
			$send.insertAfter($msg)
			$msg.keydown(function(event){
				var keycode = (event.keyCode ? event.keyCode : event.which)
				if ( keycode === 13) sendClick()
			})
		})
		
		editor.on('change',function() {
			var v = editor.getValue()
			delete v['Messages']
			delete v['Message']
			console.log(v)
			// https://pouchdb.com/guides/documents.html#storing-a%E2%80%93document
		})
	}

	function receiveMessage(msg) { //HACK
		var $msgs = $('[name="root[Messages]"]')
		var text = $msgs.text()	
		try {
			msg = JSON.parse(msg)
		} catch (err) {
			console.error(err)
			text = text + 'Could not parse "' + msg + '".'
			$msgs.text(text)
			return
		}
		if (msg.length == 2) {
			text = text + '\nCounter ' + msg[0] + ' Timestamp ' + moment.utc(msg[1] ).format('YYYY-MM-DD HH:mm:ss:SSS');
		}
		if (msg.m && msg.n) {
			text = text + ( text.trim() === '' ? '' : '\n' ) + msg.n + ': ' + msg.m
			if (msg.m.indexOf('Hello') == 0 && msg.n != app.state.editor.chat.$nick.val()) {
				var replyMsg = {
					n: app.state.editor.chat.$nick.val(),
					m: 'Welcome '
				}
				app.dispatcher.trigger('js:mqtt.sendMessage', JSON.stringify(replyMsg))
			}
		}
		if ( app.state.editor.chat ) {
			var $sound = $('[name="root[Sound]"]')
			if (msg.c) {
				text = text + '\ncounter = ' + msg.c
			} else {
				if ($sound.is(':checked')) app.util.playIntroSound()
			}
		}
		$msgs.text(text)
	}

})(window)