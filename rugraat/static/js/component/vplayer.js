'use strict';
/* global $ _ app*/
(function(root) {
	app.dispatcher.on('js:VPlayer.Create', VPlayer_Create)

	_.extend(app.component, {
		VPlayerComponent: VPlayerComponent,
	})
	
	function VPlayer_Create() {
		var newItemConfig = {
			type: 'component',
			componentName: 'vplayer',
			componentState: { 
			}
		}
		// app.state.layout.example.root.contentItems[0].addChild(newItemConfig) // rather trigger a event to add a new child
		app.dispatcher.trigger('js:GoldenLayout.addChild', { config: newItemConfig })
	}

	function VPlayerComponent(container, state) { // https://jsfiddle.net/ludo/bwuvstey/1/
		container.layoutManager.on( 'stackCreated', function( stack ){
			
			var $el = container.getElement()
			var $elState = $(state.$el)
			var $elVideoContainer = $elState.find('#video-container')

			$elState.appendTo($el)
			$elState.show()
		
			console.log('VPlayer v0.333 Visible')
				
			var ytHtml = '<iframe id="video" src="" frameborder="0" allowfullscreen></iframe>'
			var mp3Html = '<a href=>Download Link</a>'
			var atVid = 0
			var vidz = ['geYI5EWnH64', '7LFgR04wvow', 'jnv-kW-428g', 'kOW4FAF8IDY', 'aNv27umOfIY', 'YEjG7hto4vY', 'I36tGmo-zKU', 'drFsXLChrWc', 'WDFuVWSX9N8']
	
			function pause() {
				$elState.find('#video')[0].contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*')
			}
	
			function resume() {
				$elState.find('#video')[0].contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*')
			}
	
			function stop() {
				$elVideoContainer.empty()
			}
	
			function play(ev) {
				stop(ev)
				var $yt = $(ytHtml)
				$yt.width($el.width())
				$yt.height($el.height())
				$yt.attr('src', '//www.youtube.com/embed/' + vidz[atVid] + '?rel=0&autoplay=1&enablejsapi=1&version=3&playerapiid=ytplayer')
				$elVideoContainer.append($yt)
				
				//ytPlayer(vidz[atVid])
				// TODO WIP detect end of vid and play next one...
				ev.preventDefault()
			}
	
			$elState.find('#prev-video').on('click', function(ev) {
				atVid--
				play()
			})
			$elState.find('#next-video').on('click', function(ev) {
				atVid++
				play()
			})
			$elState.find('#play-video').on('click', play)
			$elState.find('#stop-video').on('click', stop)
			$elState.find('#pause-video').on('click', pause)
			$elState.find('#resume-video').on('click', resume)

		})
	}

	function ytPlayer(vidId) {
		// create youtube player
		var player

		function onYouTubePlayerAPIReady() {
			player = new YT.Player('video', {
				height: '390',
				width: '640',
				videoId: vidId,
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				}
			})
		}

		// autoplay video
		function onPlayerReady(event) {
			event.target.playVideo()
		}

		// when video ends
		function onPlayerStateChange(event) {
			if (event.data === 0) {
				alert('done')
			}
		}
	}

})(window)