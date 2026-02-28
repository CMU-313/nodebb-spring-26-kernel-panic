'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const topics = require('../src/topics');
const categories = require('../src/categories');
const User = require('../src/user');

describe('Topic Respondents', () => {
	let categoryObj;
	let adminUid;
	let user1Uid;
	let user2Uid;
	let topicId;

	before(async () => {
		// create some test users
		adminUid = await User.create({ username: 'resp_admin' });
		user1Uid = await User.create({ username: 'resp_user1' });
		user2Uid = await User.create({ username: 'resp_user2' });

		categoryObj = await categories.create({
			name: 'Respondents Test Category',
			description: 'Category for testing respondents feature',
		});

		// create a topic to test with
		const result = await topics.post({
			uid: adminUid,
			title: 'Respondents Test Topic',
			content: 'This is the main post',
			cid: categoryObj.cid,
		});
		topicId = result.topicData.tid;
	});

	it('should return the topic creator as a respondent', async () => {
		const uids = await topics.getUids(topicId);
		assert(Array.isArray(uids));
		assert(uids.includes(String(adminUid)));
	});

	it('should include users after they reply', async () => {
		await topics.reply({ uid: user1Uid, content: 'Reply from user1', tid: topicId });
		await topics.reply({ uid: user2Uid, content: 'Reply from user2', tid: topicId });

		const uids = await topics.getUids(topicId);
		assert(uids.includes(String(adminUid)));
		assert(uids.includes(String(user1Uid)));
		assert(uids.includes(String(user2Uid)));
	});

	it('should not duplicate UIDs if same user replies twice', async () => {
		await topics.reply({ uid: user1Uid, content: 'Another reply from user1', tid: topicId });

		const uids = await topics.getUids(topicId);
		// count how many times user1 shows up - should only be once
		let count = 0;
		for (const uid of uids) {
			if (uid === String(user1Uid)) {
				count += 1;
			}
		}
		assert.strictEqual(count, 1);
	});

	it('should have the right number of unique respondents', async () => {
		const uids = await topics.getUids(topicId);
		// we have 3 users: admin, user1, user2
		assert.strictEqual(uids.length, 3);
	});

	it('should be able to get user data for respondents', async () => {
		const uids = await topics.getUids(topicId);
		const users = await User.getUsersFields(uids, ['uid', 'username', 'userslug', 'picture']);

		assert.strictEqual(users.length, 3);
		// check that each user has the fields we need
		for (let i = 0; i < users.length; i++) {
			assert(users[i].uid);
			assert(users[i].username);
		}
	});

	it('should have the correct usernames', async () => {
		const uids = await topics.getUids(topicId);
		const users = await User.getUsersFields(uids, ['uid', 'username']);

		const names = [];
		for (let i = 0; i < users.length; i++) {
			names.push(users[i].username);
		}

		assert(names.includes('resp_admin'));
		assert(names.includes('resp_user1'));
		assert(names.includes('resp_user2'));
	});

	it('should return an empty array for a non-existent topic', async () => {
		const uids = await topics.getUids(999999);
		assert(Array.isArray(uids));
		assert.strictEqual(uids.length, 0);
	});

	it('should return uids as strings', async () => {
		const uids = await topics.getUids(topicId);
		for (const uid of uids) {
			assert.strictEqual(typeof uid, 'string');
		}
	});

	it('should update respondents when a new user replies', async () => {
		const user3Uid = await User.create({ username: 'resp_user3' });
		const uidsBefore = await topics.getUids(topicId);
		assert(!uidsBefore.includes(String(user3Uid)));

		await topics.reply({ uid: user3Uid, content: 'Reply from user3', tid: topicId });

		const uidsAfter = await topics.getUids(topicId);
		assert(uidsAfter.includes(String(user3Uid)));
		assert.strictEqual(uidsAfter.length, uidsBefore.length + 1);
	});

	it('should track respondents independently across different topics', async () => {
		const result = await topics.post({
			uid: user1Uid,
			title: 'Second Test Topic',
			content: 'Another topic',
			cid: categoryObj.cid,
		});
		const secondTopicId = result.topicData.tid;

		const uids = await topics.getUids(secondTopicId);
		assert.strictEqual(uids.length, 1);
		assert(uids.includes(String(user1Uid)));

		// original topic should be unaffected
		const originalUids = await topics.getUids(topicId);
		assert(originalUids.length > 1);
	});

	it('should return respondents with valid user data fields', async () => {
		const uids = await topics.getUids(topicId);
		const users = await User.getUsersFields(uids, ['uid', 'username', 'userslug', 'picture']);

		for (const u of users) {
			assert(u.hasOwnProperty('uid'));
			assert(u.hasOwnProperty('username'));
			assert(u.hasOwnProperty('userslug'));
			assert(u.hasOwnProperty('picture'));
		}
	});

	it('should not include guest uid (0) as a respondent', async () => {
		const uids = await topics.getUids(topicId);
		assert(!uids.includes('0'));
		assert(!uids.includes(0));
	});
});
