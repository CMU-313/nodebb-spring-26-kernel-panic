'use strict';

const plugin = {};

plugin.onPostGetFields = async function (hookData) {
	// Access the caller information from the automatically-injected caller property
	const caller = hookData.caller || {};
	const uid = caller.uid !== undefined ? caller.uid : null;

	// Determine user type
	let userType;
	if (uid === null) {
		userType = 'unknown (no context)';
	} else if (uid === 0) {
		userType = 'guest';
	} else if (uid === -1) {
		userType = 'spider/bot';
	} else {
		userType = `user ${uid}`;
	}

	console.log('[nodebb-plugin-post-fields-logger] filter:post.getFields hook fired!');
	console.log(`[nodebb-plugin-post-fields-logger] Accessed by: ${userType}`);

	// Log additional caller information if available
	if (caller.req) {
		console.log('[nodebb-plugin-post-fields-logger] Caller details:', JSON.stringify({
			uid: uid,
			ip: caller.req.ip,
			method: caller.req.method,
			path: caller.req.path,
			url: caller.req.url,
		}, null, 2));
	}

	console.log('[nodebb-plugin-post-fields-logger] Hook data:', JSON.stringify({
		pids: hookData.pids,
		fields: hookData.fields,
		postCount: hookData.posts ? hookData.posts.length : 0,
	}, null, 2));

	// Return the data unchanged (this is a filter hook, so we must return the data)
	return hookData;
};

module.exports = plugin;

