'use strict'; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#Invoking_strict_mode
/* global _ Backbone */ // https://devdocs.io/jsdoc/tags-global
(function(root) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures

	root.app = root.app || {} // our app namespace allow other script to create the object or it create a pojo

	_.extend(root.app, { // we assume we have _ https://underscorejs.org/ or something like lodash
		dispatcher: _.clone(Backbone.Events), // our main event loop https://backbonejs.org/#Events
		component: {}, // collection of goldenlayout and other components https://golden-layout.com/tutorials
		state: {}, // all app need to keep state somewhere
		util: {}, // see util.js
	})

})(window) // our root is our global window we pass to our closure