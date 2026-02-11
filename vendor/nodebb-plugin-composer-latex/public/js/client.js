'use strict';

(function () {
	$(window).on('action:composer.enhanced', function (evt, data) {
		require([
			'composer/formatting',
			'composer/controls',
		], function (formatting, controls) {
			if (!formatting || !controls) {
				return;
			}
			formatting.addButtonDispatch('latex', function (postContainer, textarea, selectionStart, selectionEnd) {
				if (selectionStart === selectionEnd) {
					controls.insertIntoTextarea(textarea, '$$ $$');
					textarea.setSelectionRange(selectionStart + 3, selectionEnd + 3);
					textarea.focus();
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '$$', '$$');
				}
				require(['composer/preview'], function (preview) {
					preview.render(postContainer);
				});
			});
		});
	});
}());
