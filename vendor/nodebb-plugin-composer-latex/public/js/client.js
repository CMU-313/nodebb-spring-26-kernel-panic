'use strict';

(function () {
	function registerLatexButton() {
		require([
			'composer/formatting',
			'composer/controls',
		], function (formatting, controls) {
			if (!formatting || !controls) {
				console.warn('[LaTeX Plugin] Formatting or controls not available');
				return;
			}
			
			// Get the dispatch table and register directly
			var dispatchTable = formatting.getDispatchTable();
			if (!dispatchTable) {
				console.error('[LaTeX Plugin] Could not get dispatch table');
				return;
			}
			
			// Register the button dispatch directly in the table
			// Note: 'this' is the postContainer (jQuery object) set via .call()
			dispatchTable.latex = function (postContainer, textarea, selectionStart, selectionEnd) {
				// Use 'this' as postContainer - it's set via .call() in the formatting handler
				var $postContainer = this;
				
				// Ensure we have a valid textarea element (must be raw DOM element, not jQuery)
				if (!textarea || !textarea.nodeName) {
					textarea = $postContainer.find('textarea')[0];
				}
				if (!textarea || !textarea.nodeName) {
					console.error('[LaTeX Plugin] Could not find textarea element');
					return;
				}
				
				// Ensure selectionStart and selectionEnd are valid numbers
				if (typeof selectionStart !== 'number' || isNaN(selectionStart)) {
					selectionStart = textarea.selectionStart || 0;
				}
				if (typeof selectionEnd !== 'number' || isNaN(selectionEnd)) {
					selectionEnd = textarea.selectionEnd || selectionStart;
				}
				
				if (selectionStart === selectionEnd) {
					controls.insertIntoTextarea(textarea, '$$ $$');
					// Set cursor position after the first $$
					setTimeout(function () {
						if (textarea && textarea.setSelectionRange) {
							textarea.setSelectionRange(selectionStart + 3, selectionStart + 3);
							textarea.focus();
						}
					}, 0);
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '$$', '$$');
				}
				require(['composer/preview'], function (preview) {
					preview.render($postContainer);
				});
			};
			
			// Also use the official method as backup
			formatting.addButtonDispatch('latex', dispatchTable.latex);
			
			console.log('[LaTeX Plugin] Button dispatch registered for "latex"');
		}, function (err) {
			console.error('[LaTeX Plugin] Error loading composer modules:', err);
		});
	}

	// Listen for the enhanced event
	$(window).on('action:composer.enhanced', function (evt, data) {
		console.log('[LaTeX Plugin] Composer enhanced event fired');
		registerLatexButton();
	});

	// Also try to register immediately in case composer is already loaded
	$(document).ready(function () {
		// Wait a bit for composer modules to load
		setTimeout(function () {
			registerLatexButton();
		}, 500);
	});
}());
