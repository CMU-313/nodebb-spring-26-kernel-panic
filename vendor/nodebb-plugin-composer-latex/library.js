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
		name: 'Latex',
		title: '[[nodebb-plugin-composer-latex:latex]]',
		className: 'fa fa-superscript',
		visibility: defaultVisibility,
	});
	return payload;
};
