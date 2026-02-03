'use strict';

const plugin = {};

plugin.onPostGetFields = async function (hookData) {
	console.log('[nodebb-plugin-post-fields-logger] filter:post.getFields hook fired!');
	console.log('[nodebb-plugin-post-fields-logger] Hook data:', JSON.stringify({
		pids: hookData.pids,
		fields: hookData.fields,
		postCount: hookData.posts ? hookData.posts.length : 0,
	}, null, 2));
	
	// Return the data unchanged (this is a filter hook, so we must return the data)
	return hookData;
};

module.exports = plugin;

