# NodeBB Post Fields Logger Plugin

A simple NodeBB plugin that logs when the `filter:post.getFields` hook fires.

## Purpose

This plugin demonstrates hook usage and logs post field retrieval operations for debugging and monitoring purposes.

## Installation

This plugin is included as a default plugin in NodeBB and is installed automatically via npm as a local file dependency from the `vendor/` directory.

When you run `npm install`, npm automatically creates a symlink from `node_modules/nodebb-plugin-post-fields-logger` to `vendor/nodebb-plugin-post-fields-logger`.

No manual setup is required - the symlink is created automatically during the npm install process.

## What it does

The plugin hooks into `filter:post.getFields` and logs:
- A message indicating the hook has fired
- The post IDs being retrieved
- The fields being requested
- The number of posts in the response

## Hook Information

- **Hook**: `filter:post.getFields`
- **Type**: Filter hook (must return the data unchanged)
- **Fires when**: NodeBB retrieves post fields from the database

## Files

- `index.js` - Main plugin code with hook handler
- `plugin.json` - NodeBB plugin configuration
- `package.json` - NPM package metadata

## Default Plugin

This plugin is integrated into NodeBB as a default plugin:
- Listed in `install/package.json` as: `"nodebb-plugin-post-fields-logger": "file:vendor/nodebb-plugin-post-fields-logger"`
- Added to the default plugins list in `src/install.js`
- Automatically activated during `./nodebb setup`

