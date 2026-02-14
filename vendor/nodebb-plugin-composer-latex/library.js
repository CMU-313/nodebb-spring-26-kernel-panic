'use strict';

const plugin = module.exports;

const defaultVisibility = {
	mobile: true,
	desktop: true,
	main: true,
	reply: true,
};

plugin.registerFormatting = async function (payload) {
	payload.options = payload.options || [];
	payload.options.push({
		name: 'latex',
		title: '[[nodebb-plugin-composer-latex:latex]]',
		className: 'fa fa-superscript',
		visibility: defaultVisibility,
	});
	return payload;
};

plugin.addMathJaxScript = async function (data) {
	// Add MathJax configuration and script to the header via customHTML
	if (data.templateData) {
		// Configure MathJax before loading the script
		const mathJaxConfig = '<script>window.MathJax = {tex: {inlineMath: [[\'$\', \'$\'], [\'\\\\(\', \'\\\\)\']], displayMath: [[\'$$\', \'$$\'], [\'\\\\\\\\[\', \'\\\\\\\\]\']], processEscapes: true, processEnvironments: true}, options: {ignoreHtmlClass: \'tex2jax_ignore\', processHtmlClass: \'tex2jax_process\'}};</script>';
		const mathJaxScript = '<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" id="MathJax-script" async></script>';
		const combinedScript = mathJaxConfig + '\n' + mathJaxScript;
		
		if (data.templateData.useCustomHTML) {
			// Append to existing custom HTML
			data.templateData.useCustomHTML = data.templateData.useCustomHTML + '\n' + combinedScript;
		} else {
			// Set as new custom HTML
			data.templateData.useCustomHTML = combinedScript;
		}
	}
	return data;
};
