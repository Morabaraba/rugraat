'use strict';
/* global $ _ app */
(function(root) {

	_.extend(app.component, { 
		EditorComponent : EditorComponent,
	})

	_.extend(app.state, { 
		editor : {},
	})
	
	function EditorComponent(container, state) { 
		var self = this
		var $el = container.getElement()
		self._name = state.name || 'json-editor'
		app.state.editor[self._name] = self
		self._$el = $el
		container.on('open', this._scheduleEditorCreation, this)
	}
	
	EditorComponent.prototype._scheduleEditorCreation = function() {
		var self = this
		app.util.createJsonEditor(self._$el, self._name)
	}

})(window)