import fs from 'node:fs';
import path from 'node:path';

const DRAFTS_DIR = path.resolve('posts/drafts');

function parseArgs(argv) {
  const args = { topic: '', tags: '' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--topic' && argv[i + 1]) args.topic = argv[++i];
    if (argv[i] === '--tags' && argv[i + 1]) args.tags = argv[++i];
  }
  return args;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function uniqueFilename(dir, base) {
  let name = `${base}.md`;
  let counter = 2;
  while (fs.existsSync(path.join(dir, name))) {
    name = `${base}-${counter}.md`;
    counter++;
  }
  return name;
}

async function callGemini(apiKey, topic, tags) {
  const tagInstruction = tags
    ? `Focus on these technology areas: ${tags}.`
    : '';

  const prompt = `You are an experienced technical blogger writing for dev.to.
Write an engaging, educational article targeting intermediate developers.
Use markdown formatting with headers (##, ###), code blocks, and lists.
The article should be 800-1500 words. Include practical code examples where relevant.

Write a blog article about: ${topic}
${tagInstruction}

Return ONLY a valid JSON object (no markdown fences, no extra text) with these fields:
- "title": a compelling, SEO-friendly title (max 128 characters)
- "description": 1-2 sentence description
- "body": full article body in markdown (do NOT include the title in the body)
- "suggested_tags": array of 2-4 dev.to tags (lowercase, no spaces, alphanumeric and hyphens only)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned no content: ${JSON.stringify(data)}`);
  }

  const cleaned = text.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    if (ch === '\n') return '\\n';
    if (ch === '\r') return '\\r';
    if (ch === '\t') return '\\t';
    return '';
  });

  return JSON.parse(cleaned);
}

async function main() {
  const { topic, tags } = parseArgs(process.argv);
  if (!topic) {
    console.error('Usage: node scripts/generate-draft.mjs --topic "..." [--tags "tag1,tag2"]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  console.log(`Generating article about: ${topic}`);

  const result = await callGemini(apiKey, topic, tags);

  if (!result.title || !result.body) {
    throw new Error(`Invalid response from Gemini: missing title or body`);
  }

  const articleTags = tags
    ? tags.split(',').map(t => t.trim().toLowerCase()).slice(0, 4)
    : (result.suggested_tags || []).slice(0, 4);

  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(result.title);
  const basename = `${today}-${slug}`;
  const filename = uniqueFilename(DRAFTS_DIR, basename);

  const frontmatter = [
    '---',
    `title: "${result.title.replace(/"/g, '\\"')}"`,
    `tags: ${JSON.stringify(articleTags)}`,
    `description: "${(result.description || '').replace(/"/g, '\\"')}"`,
    `date_generated: "${today}"`,
    '---',
  ].join('\n');

  const content = `${frontmatter}\n\n${result.body}\n`;

  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DRAFTS_DIR, filename), content, 'utf-8');

  console.log(`Draft saved: posts/drafts/${filename}`);
}

main().catch(err => {
  console.error('Failed to generate draft:', err.message);
  process.exit(1);
});
