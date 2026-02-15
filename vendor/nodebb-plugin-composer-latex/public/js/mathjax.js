'use strict';

(function () {
	var MATHJAX_CDN = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
	var mathJaxLoadPromise = null;

	// Ensure MathJax config is set (must be set before script loads)
	function setMathJaxConfig() {
		if (window.MathJax && window.MathJax.typesetPromise) {
			return; // already fully loaded
		}
		window.MathJax = window.MathJax || {
			tex: {
				inlineMath: [['$', '$'], ['\\(', '\\)']],
				displayMath: [['$$', '$$'], ['\\[', '\\]']],
				processEscapes: true,
				processEnvironments: true
			},
			options: {
				ignoreHtmlClass: 'tex2jax_ignore',
				processHtmlClass: 'tex2jax_process'
			}
		};
	}

	// Load MathJax from CDN if not already present
	function ensureMathJaxLoaded() {
		if (window.MathJax && window.MathJax.typesetPromise) {
			return Promise.resolve();
		}
		if (mathJaxLoadPromise) {
			return mathJaxLoadPromise;
		}

		setMathJaxConfig();

		// Check if script tag already exists
		if (document.getElementById('MathJax-script')) {
			mathJaxLoadPromise = new Promise(function (resolve) {
				var check = setInterval(function () {
					if (window.MathJax && window.MathJax.typesetPromise) {
						clearInterval(check);
						resolve();
					}
				}, 50);
				setTimeout(function () {
					clearInterval(check);
					resolve();
				}, 15000);
			});
			return mathJaxLoadPromise;
		}

		mathJaxLoadPromise = new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.id = 'MathJax-script';
			script.src = MATHJAX_CDN;
			script.async = true;
			script.onload = function () {
				// MathJax 3 runs automatically; wait for startup
				if (window.MathJax.startup && window.MathJax.startup.promise) {
					window.MathJax.startup.promise.then(resolve).catch(reject);
				} else {
					resolve();
				}
			};
			script.onerror = function () {
				reject(new Error('Failed to load MathJax from CDN'));
			};
			document.head.appendChild(script);
		});

		return mathJaxLoadPromise;
	}

	// Function to render MathJax in a specific container or the whole page
	function renderMathJax(container) {
		if (typeof window.MathJax === 'undefined' || !window.MathJax.typesetPromise) {
			return;
		}
		var elements = container ? $(container).toArray() : undefined;
		window.MathJax.typesetPromise(elements).catch(function (err) {
			console.error('MathJax rendering error:', err);
		});
	}

	// Wait for MathJax to load then render on page load
	function waitForMathJax() {
		ensureMathJaxLoaded().then(function () {
			renderMathJax();
		}).catch(function (err) {
			console.error('[LaTeX Plugin]', err);
		});
	}

	$(document).ready(function () {
		waitForMathJax();
	});

	$(window).on('action:posts.loaded action:topic.loaded action:ajaxify.end', function () {
		setTimeout(function () {
			ensureMathJaxLoaded().then(function () {
				renderMathJax();
			});
		}, 300);
	});

	// Composer preview: load MathJax if needed, then render in preview container
	$(window).on('action:composer.preview', function (evt, data) {
		function processPreview() {
			var previewContainer = (data && data.postContainer)
				? $(data.postContainer).find('.preview')
				: $('.preview');

			if (!previewContainer.length) {
				return;
			}

			ensureMathJaxLoaded()
				.then(function () {
					renderMathJax(previewContainer);
				})
				.catch(function (err) {
					console.error('[LaTeX Plugin]', err);
				});
		}

		setTimeout(processPreview, 100);
		setTimeout(processPreview, 500);
		setTimeout(processPreview, 1000);
	});
}());
