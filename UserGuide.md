## Deployment

- Our NodeBB deployment hosted by Linux can be found here: http://17313-team13.s3d.cmu.edu:4567/

## Feature 1: Anonymous Posts

- **Feature:** Per-post anonymous posting that hides the author's identity from regular users.
- **Summary:** When posting, a checkbox can be selected to post anonymously. Posts are shown as "Anonymous" to non-privileged viewers (regular users). Administrators and moderators see the original poster information. The plugin implements a two-stage hook flow to mask identities after NodeBB populates user data.
- **How it works:**
	- **Backend - Masking Posts on Retrieval:** A plugin inspects posts on `filter:post.getFields` and, when `post.isAnonymous` is true, stores the original uid, sets `post.uid = 0` for non-privileged callers (forcing guest data to load), and flags `post.isAnonymousPost` and `_callerIsPrivileged`. The plugin uses an `ANONYMOUS_USER` constant as the masked user object and keeps `_originalUid`/_originalUser fields on the post for possible later use.
	- **Backend - User Object Replacement:** After NodeBB populates user objects, `filter:topics.addPostData` replaces the guest user object with an `ANONYMOUS_USER` placeholder (username/displayname = "Anonymous") for non-privileged viewers while preserving original user data for admins/mods.
	- **Frontend - Checkbox UI:** The composer UI includes a checkbox labeled "Post Anonymously" injected by the client code in `public/src/app.js` when the composer is enhanced for topic/post creation. The checkbox element has the attribute `data-composer-anonymous`; when changed the composer container receives `data-anonymous-post="1"` (or `0`). The checkbox is inserted after the `.title-container` inside the composer (only for `topics.post` actions), and the label text is translatable in `public/language/*/user.json` files.
	- **Frontend-to-Backend - Post Creation Flow:** The `filter:composer.submit` hook in `public/src/app.js` reads the `data-anonymous-post` attribute and sets `composerData.isAnonymous` accordingly. The backend in `src/posts/create.js` then consumes this flag and persists it as `postData.isAnonymous` on the post record in the database.
- **How to test:**
	1. Run the plugin's unit tests which cover masking and privilege visibility:

		 cd vendor/nodebb-plugin-post-fields-logger
		 npm test

		 Or run the project test runner targeting the plugin tests directly:

		 npm test -- vendor/nodebb-plugin-post-fields-logger/test/anonymous-mode.js

	2. Manual/quick checks:
		 - Create a post through the UI by clicking "Post Anonymously" checkbox in the composer.
		 - View the topic as a regular user: the post should show username/displayname "Anonymous".
		 - View the topic as an admin/mod: the post should show the original username with full user details.
- **Tests:** See the plugin README and tests:
	- [vendor/nodebb-plugin-post-fields-logger/README.md](vendor/nodebb-plugin-post-fields-logger/README.md) - Plugin documentation
	- [vendor/nodebb-plugin-post-fields-logger/index.js](vendor/nodebb-plugin-post-fields-logger/index.js) - Plugin implementation with hooks
	- [vendor/nodebb-plugin-post-fields-logger/test/anonymous-mode.js](vendor/nodebb-plugin-post-fields-logger/test/anonymous-mode.js) - Comprehensive test suite including stage 1/2 hooks, privilege-based visibility, post creation flow, and edge cases
- **Why tests are sufficient:**
	- The tests provide comprehensive coverage across multiple test suites:
		- **Stage 1 Hook (`filter:post.getFields`) Tests:** Validates UID masking for non-privileged viewers, preserves original UID for privileged viewers (admins/mods), and handles privilege detection correctly.
		- **Stage 2 Hook (`filter:topics.addPostData`) Tests:** Verifies user object replacement with `ANONYMOUS_USER` placeholder for non-privileged viewers, preserves original user data for privileged viewers, and correctly handles mixed anonymous/non-anonymous posts.
		- **Privilege-Based Visibility Tests:** Tests instructor viewing student anonymous post (shows real identity), student viewing another student's anonymous post (shows "Anonymous"), and post author viewing their own anonymous post.
		- **Post Creation Flow Tests:** Validates that the `filter:composer.submit` hook captures checkbox state and `src/posts/create.js` persists the `isAnonymous` flag to the database, covering the complete frontend-to-backend integration.
		- **Edge Cases:** String/boolean type coercion for Redis storage ("true" as truthy), false/0 values not triggering masking, double-processing protection (`_originalUid`/`_originalUser`/`_originalHandle` preservation), missing caller context defaults to masking, handle field conditional setting, and `ANONYMOUS_USER` constant immutability.
	- Together, the tests ensure that posts created with the anonymous flag are properly stored and retrieved with correct visibility behavior based on viewer privileges throughout the entire system lifecycle.

## Feature 2: LaTeX Integration and Testing

- **Feature:** LaTeX button in the composer toolbar and MathJax rendering for math equations in posts and topics.
- **Summary:** Adds a LaTeX button to the NodeBB composer that wraps selected text in `$$` delimiters (or inserts `$$ $$` when nothing is selected) for display math, and injects MathJax from a CDN so that LaTeX/TeX equations render correctly in topic views and composer preview.
- **How it works:**
	- **Backend - Formatting Registration:** The plugin hooks into `filter:composer.formatting` in [library.js](vendor/nodebb-plugin-composer-latex/library.js). `registerFormatting` adds a `latex` option to the payload with `name: 'latex'`, `className: 'fa fa-superscript'`, and visibility for mobile/desktop/main/reply. It preserves any existing formatting options.
	- **Backend - MathJax Script Injection:** The plugin hooks into `filter:middleware.renderHeader`. `addMathJaxScript` appends MathJax configuration and the MathJax CDN script (`https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js`) into `templateData.useCustomHTML`, so every page load includes MathJax. It appends to existing `useCustomHTML` when present.
	- **Frontend - LaTeX Button:** In [public/js/client.js](vendor/nodebb-plugin-composer-latex/public/js/client.js), the plugin listens for `action:composer.enhanced` and registers a button dispatch via `formatting.addButtonDispatch('latex', ...)`. On click, it either wraps the selection in `$$...$$` or inserts `$$ $$` with the cursor between them. It then triggers the composer preview.
	- **Frontend - MathJax Rendering:** [public/js/mathjax.js](vendor/nodebb-plugin-composer-latex/public/js/mathjax.js) configures MathJax for inline (`$...$`, `\(...\)`) and display (`$$...$$`, `\[...\]`) math. It loads MathJax from the CDN on demand, runs `typesetPromise` on page load and when the composer preview updates, and handles the case where the header script is already present.
- **How to test:**
	1. Run the LaTeX plugin unit tests:

		 npm test -- test/plugins-composer-latex.js

		 Or run the plugin's tests directly:

		 cd vendor/nodebb-plugin-composer-latex
		 npm test

	2. Manual/quick checks:
		 - Start NodeBB and open the composer (new topic or reply).
		 - Confirm a LaTeX (superscript) button appears in the formatting toolbar.
		 - Click the button with no selection: `$$ $$` should be inserted with cursor between.
		 - Select text and click the button: text should be wrapped in `$$...$$`.
		 - Submit a post containing `$E = mc^2$` or `$$\int_0^1 x^2 dx$$`.
		 - View the topic: equations should render as math (not raw LaTeX).
		 - Check the composer preview: equations should render live as you type.
- **Tests:** Links to automated test files:
	- [test/plugins-composer-latex.js](test/plugins-composer-latex.js) - Entry point that loads the plugin unit tests
	- [vendor/nodebb-plugin-composer-latex/test/composer-latex.js](vendor/nodebb-plugin-composer-latex/test/composer-latex.js) - Unit tests for `registerFormatting` and `addMathJaxScript`
- **Why tests are sufficient:**
	- **registerFormatting tests:** Verify that the latex option is added with correct name, className, title, and visibility (mobile/desktop); that existing options are preserved; and that an empty or missing `options` array is handled correctly.
	- **addMathJaxScript tests:** Verify that MathJax config and script are injected into `templateData.useCustomHTML` with the expected content (mathjax, script, cdn.jsdelivr.net); that injection appends to existing `useCustomHTML`; and that nothing is done when `templateData` is missing.
	- These unit tests cover the backend hooks that power the LaTeX feature. The frontend button dispatch and MathJax client-side behavior are exercised via manual/end-to-end testing, which is appropriate because they depend on the NodeBB composer UI and DOM. Together, the tests ensure the plugin integrates correctly with NodeBB's formatting and header middleware, and that the math rendering pipeline is correctly configured.


## Feature 3: Fuzzy Search Testing

- **Feature:** The "Fuzzy match" search dropdown option supports fuzzy search.
- **Summary:** "Fuzzy match" enables users to input search queries and receive post results with low edit distances (word similarity). It supports input queries that with insertions, deletions, and substitutions. Relevant posts with high word similarity (minimal edit distance) appear. This feature was added to provide users with searching flexibility. Users can have typos into their search queries and still receive relevant post results.
- **How it works:** The fuzzy search feature was mainly implemented in public/src/modules/search.js. getLevenshteinDistance(a, b) computes the minimum edit distance (insertions, deletions, substitutions) between two strings using dynamic programming. fuzzyMatches(query, text) tokenizes both the query and the text, then checks if any query token is within an acceptable edit distance of any text token. The tolerance threshold scales with token length via maxFuzzyEdits(len): <= 5 chars for 1 edit, <= 9 chars for 2 edits, 10+ chars for 3 edits. There is also substring matching fallback. getFuzzyMatchRanges(query, text) traces back through the Levenshtein dynamic programming matrix to find which character positions in text align with the query, returning [start, end] ranges. highlightFuzzyInText() wraps these ranges for underlining relevant characters. 
- **Data Flow:**User selects "Fuzzy match" from the search dropdown. matchWords=fuzzy is sent as a query parameter. src/controllers/search.js passes it into template data. public/src/client/search.js reads it from the data-match-words attribute on the results container and calls Search.highlightMatches(query, els, 'fuzzy'), which uses the fuzzy highlighting path instead of the exact-regex path.
- **Edge Cases:**Empty queries return no matches. Single-character tokens are skipped during highlighting. 
- **How to test:** 
	1) Start NodeBB locally (./nodebb dev)
	2) Create a few posts with known words (e.g., "hello world", "test post")
	3) Go to the search page, select "Fuzzy match" from the match-words dropdown
	4) Search "helo" → should return the "hello" post, with "hello" underlined (shared characters highlighted)
	5) Search "tests" → should return the "test" post
	6) Search "jello" → should not return the "hello" post
	7) Switch to "Match all words" → confirm highlighting reverts to exact bold+underline behavior
	8) Automated tests can be run via `npx mocha test/search-fuzzy.js`
- **Tests:** test/fuzzy-search.js
- **Test Sufficiency:** The unit tests test the two core functions getLevenshteinDistance and fuzzyMatches, which contain all fuzzy matching logic. The unit tests cover correctness of edit distance, acceptance of small typos, rejection of unrelated words beyond threshold edit distance, edge cases, and substring matching fallback. 


## Feature 4: Listing Respondents to a Post

- **Feature:** A list containing all the users that responded to a post.
- **Summary:** When someone views a topic page, a small widget in the sidebar lists all unique users who have posted in that topic (the original author and anyone who replied). Each entry shows the user’s avatar and username, as well as links to their profile. This should allow the instructor to, for example, be able to grade the responses quickly.
- **How it works:** 
	- **Backend (data storage)**: NodeBB already keeps track of participation using a Redis sorted set:

		- **Key:** `tid:{tid}:posters` (This set stores user IDs (UIDs) and a score that represents how many posts they have in the topic.)
		- When a post is created (in `src/topics/posts.js`): NodeBB increments the poster’s score using `db.sortedSetIncrBy`.
		- When a post is deleted: NodeBB decrements the score. If the score becomes 0 or below, that UID is removed from the set. Thus the sorted set always represents the set of users who currently have at least one post in the topic.

	- **Backend (data retrieval)**: `Topics.getUids(tid)` in `src/topics/user.js` reads from the sorted set and returns all UIDs with at least one post ordered by post count (highest first).

		- It uses `db.getSortedSetRevRangeByScore` to do this. 
		- Then the topic controller (`src/controllers/topics.js`, around lines 140–143):
			1. calls `topics.getUids(tid)`
			2. loads basic user info using `user.getUsersFields` (fields: `uid`, `username`, `userslug`, `picture`)
			3. attaches the result to the topic response as `topicData.respondents`

	- **Frontend (sidebar display)**: A template partial renders the list in the topic sidebar `templates/partials/topic/respondents.tpl`

		- It shows a "Respondents" header (translated using `[[topic:respondents]]`), loops through the respondents array, and renders each user with 24px avatar, username, and link to their profile.

- **How to test:** 
	- Automated tests: refer to the bulletpoint below
	- Manual checks
		1. Create a new topic as User A and view the sidebar -> User A should appear in the respondents list.
		2. Reply as User B and User C, refresh the page -> All three users should appear (A, B, C).
		3. Reply again as User B, refresh -> User B should still appear only once (no duplicates).
		4. Click a username -> It should go to that user’s profile page.
- **Tests:**
	- Run the respondents unit tests: `npx mocha test/topics-respondents.js`
	- Test file: [test/topics-respondents.js](test/topics-respondents.js)
- **Why tests are sufficient:** The automated tests focus on the backend pipeline that generates the respondents list.

	- **Creator inclusion:** confirms the topic creator is included immediately.
	- **Reply inclusion:** confirms repliers get added after posting.
	- **No duplicates:** confirms the same user replying multiple times still shows up once.
	- **Correct count:** confirms the expected number of unique respondents is returned.
	- **User data included:** confirms the returned user objects include at least `uid` and `username`.
	- **Username accuracy:** confirms the usernames match the correct UIDs.


## Feature 5: Translate Post

- **Feature:** English post translation via an external translator microservice.
- **Summary:** Under each post there's a "Translate text" button. Clicking it sends the post content to an external translation microservice, which detects the language and returns an English translation. The result is shown inline below the post. If the translation service is unavailable or times out, the original text is displayed with a fallback message.
- **How it works:**
	- **Backend - API Endpoint:** A `GET /api/v3/posts/{pid}/translate` route is registered in [src/routes/write/posts.js](src/routes/write/posts.js). The controller in [src/controllers/write/posts.js](src/controllers/write/posts.js) delegates to `api.posts.getTranslation()`.
	- **Backend - Translation Logic:** In [src/api/posts.js](src/api/posts.js) (lines 88–133), `postsAPI.getTranslation` performs the following:
		1. Checks `topics:read` privilege for the calling user.
		2. Fetches post content (respecting deleted-post visibility for admins/mods and post owners).
		3. Calls the external translator microservice at `TRANSLATOR_URL` (default: `http://128.2.220.236:5001`) with the post content as a query parameter: `GET {TRANSLATOR_URL}/?content={encodedText}`.
		4. Parses the microservice JSON response (`is_english`, `translated_content`) and returns a response object containing `pid`, `sourceLanguage`, `targetLanguage`, `translatedText`, and `wasTranslated`.
		5. On any error or timeout (default 5 seconds, configurable via `LLM_TRANSLATE_TIMEOUT_MS`), gracefully falls back to returning the original text with `wasTranslated: false`.
	- **Frontend - Translate Button:** The post template in [vendor/nodebb-theme-harmony-main/templates/partials/topic/post.tpl](vendor/nodebb-theme-harmony-main/templates/partials/topic/post.tpl) (lines 87–92) includes a "Translate text" button (`[component="post/translate"]`) and a hidden container for displaying results.
	- **Frontend - Click Handler:** In [public/src/client/topic/postTools.js](public/src/client/topic/postTools.js) (lines 293–347), clicking the button calls `GET /api/v3/posts/{pid}/translate`. On success, it shows the detected language and translated text in the collapsible container. Subsequent clicks toggle the container's visibility. On failure, it displays "Translation unavailable right now. Showing original text."
	- **Configuration:** Two environment variables control the feature:
		- `TRANSLATOR_URL` — URL of the translation microservice (default: `http://128.2.220.236:5001`)
		- `LLM_TRANSLATE_TIMEOUT_MS` — Request timeout in milliseconds (default: `5000`)
- **How to test:**
	1. Ensure the translator microservice is running (locally at `http://localhost:5001` or at the default CMU address).
	2. Start NodeBB (`./nodebb dev`) with `TRANSLATOR_URL` set if using a local service.
	3. Create a post with non-English text (e.g., "Hola mundo, esta es una prueba").
	4. View the topic and click "Translate text" below the post.
	5. The detected language ("Non-English") and translated English text should appear in a bordered container below the post.
	6. Click the button again to toggle the translation container visibility.
	7. Test fallback: stop the translator service and click "Translate text" on a post — the message "Translation unavailable right now. Showing original text." should appear with the original content.
	8. Verify that deleted posts cannot be translated by non-privileged users, and that admins/mods can still translate deleted posts.
- **Tests:** The feature does not currently have dedicated automated tests. Testing is manual as described above.
- **Key files:**
	- [src/api/posts.js](src/api/posts.js) — Backend translation logic
	- [src/controllers/write/posts.js](src/controllers/write/posts.js) — HTTP controller
	- [src/routes/write/posts.js](src/routes/write/posts.js) — Route registration
	- [public/src/client/topic/postTools.js](public/src/client/topic/postTools.js) — Frontend click handler and UI logic
	- [vendor/nodebb-theme-harmony-main/templates/partials/topic/post.tpl](vendor/nodebb-theme-harmony-main/templates/partials/topic/post.tpl) — Post template with translate button
	- [public/openapi/write/posts/pid/translate.yaml](public/openapi/write/posts/pid/translate.yaml) — OpenAPI specification