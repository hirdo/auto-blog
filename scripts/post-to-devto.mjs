import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const READY_DIR = path.resolve('posts/ready');
const PUBLISHED_DIR = path.resolve('posts/published');

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

  const filename = files[0];
  const filepath = path.join(READY_DIR, filename);
  console.log(`Posting: ${filename}`);

  const raw = fs.readFileSync(filepath, 'utf-8');
  const { data: frontmatter, content: body } = matter(raw);

  if (!frontmatter.title) {
    console.error(`Missing title in frontmatter of ${filename}`);
    process.exit(1);
  }
  if (!body.trim()) {
    console.error(`Empty body in ${filename}`);
    process.exit(1);
  }

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(t => String(t).toLowerCase().replace(/\s+/g, '-')).slice(0, 4)
    : [];

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      article: {
        title: frontmatter.title,
        body_markdown: body.trim(),
        tags,
        description: frontmatter.description || '',
        published: false,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`dev.to API error ${res.status}: ${errBody}`);
    process.exit(1);
  }

  const article = await res.json();
  console.log(`Draft created on dev.to: ${article.url}`);

  if (!fs.existsSync(PUBLISHED_DIR)) fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
  fs.renameSync(filepath, path.join(PUBLISHED_DIR, filename));
  console.log(`Moved: posts/ready/${filename} → posts/published/${filename}`);
}

main().catch(err => {
  console.error('Failed to post article:', err.message);
  process.exit(1);
});
