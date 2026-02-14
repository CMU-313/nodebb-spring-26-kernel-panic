# LaTeX Plugin – Code Summary & Merge Instructions

## 1. What Code Was Changed

### New plugin: `vendor/nodebb-plugin-composer-latex/`

| File | Purpose |
|------|--------|
| **library.js** | Server-side: adds LaTeX button to composer (`filter:composer.formatting`), optionally injects MathJax in header (`filter:middleware.renderHeader`). |
| **plugin.json** | Plugin manifest: id, name, scripts, language path, hooks. |
| **package.json** | NPM package info (name, version, description). |
| **public/js/client.js** | Registers the LaTeX toolbar button with the composer: on click, inserts `$$ $$` or wraps selection with `$$...$$`. Uses `this` as postContainer (jQuery) to avoid `find is not a function`. |
| **public/js/mathjax.js** | Loads MathJax from CDN if not present (`ensureMathJaxLoaded()`), sets config for `$`/`$$` delimiters, runs `typesetPromise()` on composer preview and on topic/post content. |
| **public/languages/en_GB.json** | Translation for button label: `"latex": "LaTeX"`. |

### Changes in NodeBB repo (this project)

| File | Change |
|------|--------|
| **package.json** | Added dependency: `"nodebb-plugin-composer-latex": "file:vendor/nodebb-plugin-composer-latex"`. |

No changes were made to `src/install.js` (the plugin is enabled via Admin → Plugins or by adding it to default plugins if desired).

---

## 2. Main behavior

- **Toolbar**: Composer gets a “LaTeX” button (superscript icon). Click inserts `$$ $$` or wraps selection in `$$...$$`.
- **Rendering**: MathJax 3 is loaded from CDN by the client script when needed (no reliance on theme custom HTML). Inline `$...$` and display `$$...$$` are rendered in preview and in posts.

---

## 3. How to Merge as a Pull Request to Main

From your feature branch (e.g. `feature/latex-compatibility`):

```bash
# 1. Commit all plugin and package.json changes
git add vendor/nodebb-plugin-composer-latex/
git add package.json package-lock.json
git status   # confirm only intended files
git commit -m "Add LaTeX plugin: composer button + MathJax rendering in preview and posts"

# 2. Push your branch to the remote
git push -u origin feature/latex-compatibility

# 3. Open a Pull Request
# In GitHub/GitLab: create PR from feature/latex-compatibility → main (or your default branch).

# 4. After review/merge, update local main and optionally delete the feature branch
git checkout main
git pull origin main
git branch -d feature/latex-compatibility
```

If your “main remote” is a fork, use your fork’s URL as `origin` and open the PR against `main` (or `master`) on that fork.

---

## 4. What Other Developers / Users Need to Do

### A. Developers who clone the repo after the merge

```bash
git clone <repo-url>
cd nodebb-spring-26-kernel-panic
git checkout main
npm install          # installs dependencies, including file:vendor/nodebb-plugin-composer-latex
./nodebb build       # requires Redis (or your DB) to be running
./nodebb start       # or use your usual start command
```

Then in the NodeBB admin:

1. **Extend → Plugins**  
2. Find **Composer LaTeX**  
3. Click **Activate** if it’s not already active  
4. Rebuild if prompted: `./nodebb build`

### B. Existing installs (already have the repo)

```bash
git pull origin main
npm install
./nodebb build
./nodebb restart
```

Activate **Composer LaTeX** in Admin → Plugins if it’s not active.

### C. Users / admins (no git)

If the plugin is not bundled (e.g. they use a clean NodeBB and only install plugins via npm):

```bash
npm install nodebb-plugin-composer-latex
./nodebb build
./nodebb restart
```

Then **Admin → Extend → Plugins** → activate **Composer LaTeX**.

### D. Requirements for the feature to work

- **Markdown**: Post content type should be Markdown (Admin → Settings → Posting).
- **Redis (or DB)**: Must be running for `./nodebb build` and `./nodebb start`.
- **Browser**: First time opening composer preview may take a moment while MathJax loads from the CDN.

---

## 5. Optional: Enable LaTeX by default for new installs

To auto-enable the plugin for new NodeBB setups, add it in `src/install.js` in the `defaultEnabled` array:

```javascript
let defaultEnabled = [
	'nodebb-plugin-composer-default',
	'nodebb-plugin-dbsearch',
	'nodebb-plugin-markdown',
	'nodebb-plugin-mentions',
	'nodebb-plugin-web-push',
	'nodebb-widget-essentials',
	'nodebb-rewards-essentials',
	'nodebb-plugin-emoji',
	'nodebb-plugin-emoji-android',
	'nodebb-plugin-post-fields-logger',
	'nodebb-plugin-composer-latex',   // add this line
];
```

Then include `src/install.js` in the same commit/PR if you want that behavior.
