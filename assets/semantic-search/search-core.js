// Environment-independent search logic, shared by the browser runtime and tests.
// Works with any sql.js Database; `embed` turns a string into a vector.

import { KEYWORD_DEFAULTS, createKeywordIndex } from "./keyword-search.js";

export const SCHEMA_VERSION = 1;

const PASSAGES_SQL = `
  SELECT c.id, c.document_id, c.content, cosine_similarity(c.embedding, $query) AS semantic
  FROM chunks c
`;

// Embeddings are little-endian float32 blobs. sql.js hands blobs over as
// Uint8Array views that may not be 4-byte aligned, in which case we copy.
export function toFloat32(blob) {
  if (blob.byteOffset % 4 === 0) {
    return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
  }
  return new Float32Array(blob.slice().buffer);
}

export function toBlob(vector) {
  const floats = vector instanceof Float32Array ? vector : Float32Array.from(vector);
  return new Uint8Array(floats.buffer, floats.byteOffset, floats.byteLength);
}

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

export function readMeta(db) {
  const meta = {};
  const [result] = db.exec("SELECT key, value FROM meta");
  for (const [key, value] of result ? result.values : []) {
    meta[key] = JSON.parse(value);
  }
  return meta;
}

// Maps a cosine similarity onto the scale of the keyword score using the
// levels measured at build time: 0 at the score unrelated queries reach
// ("noise") and 1 at the score a post's title reaches against the post
// ("relevance"). Below noise is 0; above relevance goes past 1 rather than
// being capped, so strong matches keep their order. Without calibration it
// returns the cosine.
export function semanticScale(calibration) {
  const noise = calibration?.noise;
  if (typeof noise !== "number") return (cosine) => cosine;
  const top = typeof calibration.relevance === "number" && calibration.relevance > noise ? calibration.relevance : 1;
  return (cosine) => Math.max(0, (cosine - noise) / (top - noise));
}

function registerFunctions(db) {
  db.create_function("cosine_similarity", (a, b) => cosineSimilarity(toFloat32(a), toFloat32(b)));
}

function loadDocuments(db) {
  const documents = new Map();
  const [result] = db.exec("SELECT id, url, title, date, excerpt, data FROM documents");
  for (const [id, url, title, date, excerpt, data] of result ? result.values : []) {
    documents.set(id, { id, url, title, date, excerpt, data: data ? JSON.parse(data) : {} });
  }
  return documents;
}

function loadKeywordIndex(db, settings) {
  const [result] = db.exec(
    "SELECT c.id, d.title, c.content FROM chunks c JOIN documents d ON d.id = c.document_id"
  );
  const passages = (result ? result.values : []).map(([id, title, content]) => ({
    id,
    text: `${title ?? ""}\n${content ?? ""}`,
  }));
  return createKeywordIndex(passages, settings);
}

export function createSearcher({ db, embed }) {
  const meta = readMeta(db);
  if (meta.schema_version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported search index schema ${meta.schema_version}; expected ${SCHEMA_VERSION}`);
  }
  registerFunctions(db);
  const documents = loadDocuments(db);
  const keywordDefaults = { ...KEYWORD_DEFAULTS, ...meta.keyword_search };
  const scaleSemantic = semanticScale(meta.calibration);

  // Built on the first keyword search (or now, when the site enables it).
  let keywordIndex;
  const getKeywordIndex = () => (keywordIndex ??= loadKeywordIndex(db, keywordDefaults));
  if (keywordDefaults.enabled) getKeywordIndex();

  // Options override the settings stored in the index (from _config.yml):
  //   limit                 most results to return (default 10)
  //   minScore              cosine similarity a passage needs (default min_score; -1 shows all)
  //   keyword.enabled       use keyword search (default keyword_search.enabled)
  //   keyword.weight        share of the keyword score in the ranking
  //   keyword.minScore      keyword score at which a match counts: it returns the
  //                         passage whatever its cosine, and adds to its rank
  //   keyword.typoTolerance match words one edit away
  async function search(query, { limit = 10, minScore = meta.min_score ?? -1, keyword = {} } = {}) {
    const text = String(query ?? "").trim();
    if (!text) return [];

    const settings = {
      enabled: keyword.enabled ?? keywordDefaults.enabled,
      weight: keyword.weight ?? keywordDefaults.weight,
      minScore: keyword.minScore ?? keywordDefaults.min_score,
      typoTolerance: keyword.typoTolerance ?? keywordDefaults.typo_tolerance,
    };

    const vector = await embed(`${meta.query_prefix ?? ""}${text}`);
    if (vector.length !== meta.dimensions) {
      throw new Error(`Query embedding has ${vector.length} dimensions; index has ${meta.dimensions}`);
    }

    const keywordResults = settings.enabled ? getKeywordIndex().search(text, settings) : new Map();
    const best = new Map(); // document id → best passage

    const statement = db.prepare(PASSAGES_SQL);
    try {
      statement.bind({ $query: toBlob(vector) });
      while (statement.step()) {
        const [id, documentId, content, semantic] = statement.get();
        const match = keywordResults.get(id);
        const keywordScore = match?.score ?? 0;

        // Keyword evidence counts only once it is strong enough: weak overlaps
        // on everyday words in long questions would otherwise reorder results
        // the embeddings rank well.
        const strongKeyword = settings.enabled && keywordScore >= settings.minScore;
        if (semantic < minScore && !strongKeyword) continue;

        const score = settings.enabled
          ? (1 - settings.weight) * scaleSemantic(semantic) + settings.weight * (strongKeyword ? keywordScore : 0)
          : semantic;
        const current = best.get(documentId);
        if (!current || score > current.score) {
          best.set(documentId, {
            passage: content,
            score,
            semantic,
            keyword: keywordScore,
            matches: match?.matches ?? [],
          });
        }
      }
    } finally {
      statement.free();
    }

    return [...best]
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, limit)
      .map(([documentId, passage]) => ({ ...documents.get(documentId), ...passage }));
  }

  return { meta, search };
}
