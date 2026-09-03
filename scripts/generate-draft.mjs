import fs from 'node:fs';
import path from 'node:path';

const DRAFTS_DIR = path.resolve('posts/drafts');

const TEXT_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-2.5-flash',
];

const delay = ms => new Promise(r => setTimeout(r, ms));

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

function sanitizeJsonString(text) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (inString && ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && code < 0x20) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    result += ch;
  }

  return result;
}

async function callGemini(apiKey, model, topic, tags) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
    const err = new Error(`Gemini API error ${res.status}: ${errBody}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned no content: ${JSON.stringify(data)}`);
  }

  return JSON.parse(sanitizeJsonString(text));
}

async function searchCoverImage(pexelsKey, topic) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(topic)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: pexelsKey } },
  );

  if (!res.ok) {
    throw new Error(`Pexels API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const url = data.photos?.[0]?.src?.landscape;
  if (!url) {
    throw new Error('No matching images found on Pexels');
  }

  return url;
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

  let result;
  for (let i = 0; i < TEXT_MODELS.length; i++) {
    const model = TEXT_MODELS[i];
    console.log(`Trying model: ${model}`);
    try {
      result = await callGemini(apiKey, model, topic, tags);
      break;
    } catch (err) {
      if (err.status === 503 && i < TEXT_MODELS.length - 1) {
        console.warn(`Model ${model} unavailable (503), falling back to next model...`);
        continue;
      }
      if (i < TEXT_MODELS.length - 1) {
        console.warn(`Model ${model} failed (${err.message}), retrying with same model after 2s...`);
        await delay(2000);
        try {
          result = await callGemini(apiKey, model, topic, tags);
          break;
        } catch (retryErr) {
          console.warn(`Retry failed, falling back to next model...`);
          continue;
        }
      }
      throw err;
    }
  }

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

  let coverImageUrl = '';
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    console.log('Searching for cover image...');
    try {
      coverImageUrl = await searchCoverImage(pexelsKey, topic);
      console.log(`Cover image found: ${coverImageUrl}`);
    } catch (err) {
      console.warn(`Warning: Could not find cover image: ${err.message}`);
      console.warn('Continuing without cover image.');
    }
  }

  const frontmatterLines = [
    '---',
    `title: "${result.title.replace(/"/g, '\\"')}"`,
    `tags: ${JSON.stringify(articleTags)}`,
    `description: "${(result.description || '').replace(/"/g, '\\"')}"`,
    `date_generated: "${today}"`,
  ];
  if (coverImageUrl) {
    frontmatterLines.push(`cover_image: "${coverImageUrl}"`);
  }
  frontmatterLines.push('---');
  const frontmatter = frontmatterLines.join('\n');

  const content = `${frontmatter}\n\n${result.body}\n`;

  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DRAFTS_DIR, filename), content, 'utf-8');

  console.log(`Draft saved: posts/drafts/${filename}`);
}

main().catch(err => {
  console.error('Failed to generate draft:', err.message);
  process.exit(1);
});
