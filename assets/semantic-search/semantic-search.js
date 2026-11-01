// Browser runtime for jekyll-semantic-search.
//
// Loaded by the {% semantic_search %} tag. On page load it downloads the
// SQLite index, then loads the embedding model recorded in that index with
// Transformers.js. Queries are embedded and searched entirely in the browser.
//
//   await SemanticSearch.search("how do I bake bread?", { limit: 5 })
//
// Without the tag, call SemanticSearch.start({ databaseUrl, sqlJsUrl, transformersUrl }).
//
// Events dispatched on `document`: semantic-search:ready,
// semantic-search:progress (model download progress), semantic-search:error.

import { createSearcher } from "./search-core.js";

function readConfig() {
  const element = document.getElementById("semantic-search-config");
  return element ? JSON.parse(element.textContent) : {};
}

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(`semantic-search:${name}`, { detail }));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function openDatabase({ databaseUrl, sqlJsUrl }) {
  const base = sqlJsUrl.endsWith("/") ? sqlJsUrl : `${sqlJsUrl}/`;
  const [SQL, buffer] = await Promise.all([
    (window.initSqlJs ? Promise.resolve() : loadScript(`${base}sql-wasm.js`))
      .then(() => window.initSqlJs({ locateFile: (file) => `${base}${file}` })),
    fetch(databaseUrl).then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch ${databaseUrl}: ${response.status}`);
      return response.arrayBuffer();
    }),
  ]);
  return new SQL.Database(new Uint8Array(buffer));
}

function modelLoader({ transformersUrl }, meta) {
  let extractor;
  return () => {
    extractor ??= import(transformersUrl).then(({ pipeline }) =>
      pipeline("feature-extraction", meta.model, {
        dtype: meta.dtype,
        progress_callback: (progress) => emit("progress", progress),
      })
    );
    return extractor;
  };
}

export async function init(overrides = {}) {
  const config = { ...readConfig(), ...overrides };
  const db = await openDatabase(config);

  let loadModel;
  const embed = async (text) => {
    const extractor = await loadModel();
    const output = await extractor(text, { pooling: searcher.meta.pooling, normalize: searcher.meta.normalize });
    return output.data;
  };
  const searcher = createSearcher({ db, embed });
  loadModel = modelLoader(config, searcher.meta);

  if (config.preloadModel !== false) await loadModel();
  return searcher;
}

let ready;

// Starts loading once; later calls return the same promise.
function start(overrides) {
  ready ??= init(overrides).then(
    (searcher) => {
      emit("ready", { meta: searcher.meta });
      return searcher;
    },
    (error) => {
      console.error("[semantic-search]", error);
      emit("error", { error });
      throw error;
    }
  );
  ready.catch(() => {}); // failures are reported via the event and to callers of search()
  return ready;
}

export const SemanticSearch = {
  start,
  get ready() {
    return ready;
  },
  search: async (query, options) => (await start()).search(query, options),
};

window.SemanticSearch = SemanticSearch;

if (document.getElementById("semantic-search-config")) start();
