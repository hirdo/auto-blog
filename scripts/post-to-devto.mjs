import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const READY_DIR = path.resolve('posts/ready');
const PUBLISHED_DIR = path.resolve('posts/published');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function postArticle(apiKey, filename) {
  const filepath = path.join(READY_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf-8');
  const { data: frontmatter, content: body } = matter(raw);

  if (!frontmatter.title) {
    throw new Error(`Missing title in frontmatter`);
  }
  if (!body.trim()) {
    throw new Error(`Empty body`);
  }

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(t => String(t).toLowerCase().replace(/\s+/g, '-')).slice(0, 4)
    : [];

  const article = {
    title: frontmatter.title,
    body_markdown: body.trim(),
    tags,
    description: frontmatter.description || '',
    published: false,
  };

  if (frontmatter.cover_image) {
    article.main_image = frontmatter.cover_image.startsWith('http')
      ? frontmatter.cover_image
      : process.env.GITHUB_REPOSITORY
        ? `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main/posts/images/${frontmatter.cover_image}`
        : undefined;
    if (article.main_image) console.log(`  Cover image: ${article.main_image}`);
  }

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({ article }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`dev.to API error ${res.status}: ${errBody}`);
  }

  const posted = await res.json();

  if (!fs.existsSync(PUBLISHED_DIR)) fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
  fs.renameSync(filepath, path.join(PUBLISHED_DIR, filename));

  return posted.url;
}

async function main() {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    console.error('Missing DEVTO_API_KEY environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(READY_DIR)) {
    console.log('No articles ready to post (posts/ready/ does not exist).');
    process.exit(0);
  }

  const files = fs.readdirSync(READY_DIR)
    .filter(f => f.endsWith('.md') && f !== '.gitkeep')
    .sort();

  if (files.length === 0) {
    console.log('No articles ready to post.');
    process.exit(0);
  }

  console.log(`Found ${files.length} article(s) to post.\n`);

  const posted = [];
  const failed = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    if (i > 0) await delay(3000);

    console.log(`[${i + 1}/${files.length}] Posting: ${filename}`);
    try {
      const url = await postArticle(apiKey, filename);
      console.log(`  ✓ Draft created: ${url}`);
      console.log(`  Moved → posts/published/${filename}`);
      posted.push(filename);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      failed.push(filename);
    }
  }

  console.log(`\nDone: ${posted.length} posted, ${failed.length} failed out of ${files.length}.`);

  if (posted.length === 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Failed to post articles:', err.message);
  process.exit(1);
});
