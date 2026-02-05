# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static personal website for Nick Titterton. No build step, no package manager, no framework — just plain HTML, CSS, and JS served directly. Hosted on AWS S3.

## Architecture

- **All pages are standalone HTML files** in the repo root. Each includes its own Bootstrap 4.1 CDN link and shared nav bar markup (duplicated per page, not templated).
- **Nav bar** links: index.html (home), about.html, projects.html, blog.html, resume PDF.
- **blog.html** is the chronological index of posts. Each entry links to a standalone HTML file (e.g., `tdm.html`, `sp.html`). New blog entries go at the top of the list.
- **style/main.css** — minimal shared CSS (just canvas border currently). Most styling comes from Bootstrap utility classes.
- **scripts/** — page-specific JS (trees.js, clusterMe.js, expandcollapse.js). No bundler.
- **imgs/** — images referenced by pages. Book review cover images use lowercase names matching the page (e.g., `tdm.jpg` for `tdm.html`).
- **files/** — downloadable assets (resume PDF).
- **classicsProject/** — self-contained multi-page sub-project.

## Deployment

Site is deployed to S3. After pushing to GitHub, files should be synced to the S3 bucket. A GitHub Actions workflow (`.github/workflows/deploy.yml`) handles this automatically on push to main.

## Adding a New Blog Post

1. Create a new HTML file in the repo root (copy structure from an existing post like `tdm.html`).
2. Add a corresponding entry at the top of `blog.html` with the correct link and date.
3. If the post has images, add them to `imgs/`.

## Local Development

Open any HTML file directly in a browser — no server needed. For a local server:
```
python3 -m http.server 8000
```

## Git

- Remote: `https://github.com/NTitterton/personalwebsite.git`
- Main branch: `main`
- `.gitignore` only excludes `.DS_Store`
