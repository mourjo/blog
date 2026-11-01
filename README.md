## Blog

My personal blog, published [here](https://mourjo.me/blog/).


### Install Jekyll
This uses Jekyll `4.2.0`.

```shell
brew install ruby
brew install rbenv
rbenv init
```

If on Ubuntu, uninstall `ruby-build` from package-manager to get the latest Ruby
versions in `rbenv`.
```shell
sudo apt remove ruby-build

# Install it as an rbenv plugin
mkdir -p "$(rbenv root)"/plugins
git clone https://github.com/rbenv/ruby-build.git "$(rbenv root)"/plugins/ruby-build

```

Add to `.zshrc`:

```shell
eval "$(rbenv init -)"
export PATH=$PATH:$HOME/.gem/ruby/3.0.0/bin
```

Install Jekyll:
```shell
# Install Ruby version
cd path/to/repo
ls .ruby-version
rbenv install

# Install jekyll locally (add --user-install if appropriate)
gem install bundler jekyll

# Install gems
bundle install
```

If there are some older gems that don't work, try uninstalling them and reinstalling it
```shell
gem uninstall ffi
gem install bundler jekyll
bundle install
```

After this, the correct Jekyll version should be installed

```shell
bundle exec jekyll -v
#jekyll 4.2.0
```

Serve using
```shell
bundle exec jekyll s
```


### Search

The search bar combines two kinds of search, both running in the visitor's browser
with no server:

- **Semantic search** ([jekyll-semantic-search](https://github.com/mourjo/jekyll-semantic-search))
  finds posts by meaning: "does AI make engineers more productive" finds
  *The Glass Dome Of AI Productivity* although they share almost no words.
- **Keyword search** (BM25, in this repo) finds exact and near word matches that
  embeddings miss: names and rare terms ("duolingo", "jqwik"), typos ("duolingoo"),
  half-typed words ("salzb"), and the external articles listed in
  `_data/external_articles.json`, which have no embeddings.

Both scores are normalised to the range 0–1 and combined into one ranking.

The plugin needs Ruby 3.3 or newer (see `.ruby-version`).

#### How it works

At build time (`bundle exec jekyll build`):

1. The semantic search plugin splits each post into passages, embeds them with the
   model, and writes `assets/semantic-search/index.sqlite3`. Embeddings are cached in
   `.jekyll-cache/`, so only new or changed posts are embedded again. The first build
   downloads the model (into `~/.cache/informers`).
2. `_plugins/keyword_search_index.rb` writes `assets/semantic-search/keyword-index.json`:
   the words of every post and external article, with their counts (about 130 KB).

Posts in the `hidden` category are left out of both indexes
(`_plugins/semantic_search_exclusions.rb`). To leave out any other post, add
`semantic_search: false` to its front matter.

In the browser (`js/search.js`, `js/hybrid-search.js`):

1. When the page loads, only the semantic index is downloaded. The model (~32 MB)
   and the keyword index are downloaded the first time someone clicks into the
   search bar.
2. Each query is scored by both searches and the results are combined (see
   [Scoring](#scoring)).
3. If semantic results take longer than 300 ms, which they do on the first search
   while the model downloads, keyword results are shown first and replaced when the
   combined results are ready. If the model cannot load, the keyword results stay.

#### Configuration

All settings live under `semantic_search` in `_config.yml`:

```yaml
semantic_search:
  model: Xenova/all-MiniLM-L12-v2
  min_score: 0.28
  preload_model: false

  keyword_search:
    enabled: true
    weight: 0.3
    min_score: 0.4
    k1: 1.2
    b: 0.75
    title_boost: 3
    semantic_ceiling: 0.69
    extra_documents: external_articles
```

**Semantic search** (read by the plugin; its
[README](https://github.com/mourjo/jekyll-semantic-search#configuration) lists
the rest of its settings):

| Setting | Value here | What it does |
|---|---|---|
| `model` | `Xenova/all-MiniLM-L12-v2` | Embedding model, used at build time and in the browser. Of 8 models compared on this blog's posts, it separated relevant from off-topic queries most cleanly (about 32 MB). Changing it re-embeds every post on the next build, and `min_score` and `semantic_ceiling` must be re-tuned. |
| `min_score` | `0.28` | Cosine similarity a post needs to be a semantic match. In testing, off-topic queries ("recipe for chocolate cake") scored up to 0.26 and the weakest correct match 0.30. `auto` lets the plugin estimate it at each build, but it chose 0.385 for this blog, which hid 5 of 28 correct results. |
| `preload_model` | `false` | `false`: the model is downloaded when someone first clicks into the search bar. `true`: on every page load. |

**Keyword search** (`keyword_search`, read by `_plugins/keyword_search_index.rb`
and written into the keyword index for the browser):

| Setting | Default | What it does |
|---|---|---|
| `enabled` | `true` | `false` turns keyword search off: the keyword index is not built, and search is semantic only. |
| `weight` | `0.3` | Share of the final score that comes from keyword search; semantic search gets the rest. `0` ranks by semantic score alone (keyword-only matches are still shown, below the rest); `1` ranks by keyword score alone. Results were the same from 0.3 to 0.5; 0.3 keeps semantic search, which understands meaning, in charge. |
| `min_score` | `0.4` | Keyword score (0–1) a post needs to be shown *as a keyword match alone*. Posts that pass the semantic `min_score` are shown regardless. At 0.3, "how to house train a puppy" matched posts containing "house" and "train"; at 0.4 none of the off-topic test queries matched anything. Lower it to show more weak matches, raise it if unrelated posts appear for common words. |
| `k1` | `1.2` | BM25 term-frequency saturation: how much a word repeated in a post adds. Each repetition adds less than the last; higher `k1` makes repetitions count for more. 1.2 is the standard value. |
| `b` | `0.75` | BM25 length normalisation, from 0 (post length ignored) to 1 (fully normalised): how much a match counts for less in a long post than in a short one. 0.75 is the standard value. |
| `title_boost` | `3` | Words in a post's title count this many times, so a match in the title outweighs one in passing. |
| `semantic_ceiling` | `0.69` | Cosine similarity treated as a perfect semantic match when normalising semantic scores (see [Scoring](#scoring)). 0.69 is the typical score of a post's title against its own text with this model. Re-tune it when changing the model. |
| `extra_documents` | none | Name of a `_data` file whose entries are searched by keywords only, here `external_articles` for articles published elsewhere. Each entry needs `title`, `url` and `description` (the text to search; `date` is optional). |
| `file` | `keyword-index.json` | File name of the keyword index, written to the plugin's `output_dir`. |

#### Scoring

For each query and post, both searches give a score from 0 to 1:

- **Keyword score** is the larger of:
  - the BM25 score divided by the highest BM25 score the query could possibly get
    (the limit as every query word is repeated more and more). So 1 means
    every word matched as strongly as BM25 allows; a word found in no post lowers the
    score, and a weak best match stays weak instead of being stretched to 1.
  - title coverage: the share of the query found in the post's title, with rare
    words counting for more. This keeps a long post titled "History" from being
    buried by posts that only mention history.
- **Semantic score** maps cosine similarity onto 0–1: `min_score` (0.28) becomes 0,
  `semantic_ceiling` (0.69) or higher becomes 1.

The final score is `(1 − weight) × semantic + weight × keyword`. A post is shown if its
cosine similarity reaches the semantic `min_score` *or* its keyword score reaches the
keyword `min_score`. At most 8 results are shown, highest score first.

Words are matched after lower-casing, removing accents, dropping common English
words ("the", "how", ...), and light stemming ("tests", "testing" and "tested" all
match "test"). Near matches count for less than exact ones (constants at the top of
`js/hybrid-search.js`):

| Match | Counts as | Example |
|---|---|---|
| Exact (after stemming) | 1.0 | "consumers" → "consumer" |
| Start of a longer word, 3+ letters | 0.8 | "kube" → "kubernetes" |
| One letter added, removed or changed, 5+ letters | 0.7 | "duolingoo" → "duolingo" |

Near matches are only tried for words that appear in no post. Text in any script is
indexed; Chinese and Japanese, which have no spaces between words, are split into
pairs of characters. The model is English only, so the semantic side does not help
with other languages.

#### Re-tuning

Re-check `semantic_search.min_score` and `semantic_ceiling` after changing the model,
and the keyword `min_score` if the blog's content changes a lot. Pick a handful of
queries with a known right answer, and a handful that should match nothing. Then look
at their scores: in the browser console, `await SemanticSearch.search("query", { minScore: -1 })`
returns every post's cosine similarity. Set each threshold between the scores of
the weakest right answer and the strongest unrelated match.

### Adding new category
Remember to the category to Makefile's `publish` target - otherwise it will not get refreshed

### Publishing from Obsidian

1. Copy posts from Obsidian `python3 copy_from_obsidian.py 2024-12-06-dev-tooling-in-the-age-of-ai.md`
2. Use `make watchbuild` to build the site incrementally on `master` branch
3. Commit new changes (the Github actions bot changes already commits from feed URLs)
4. Use the deploy script `./deploy.sh`

### Publishing Manually

Make all changes on `master`.
Generating the site is done by locally running Jekyll to build the site.
Publishing is done by copying generated files from a branch (usually `master`) to `gh-pages`.

1. Commit new changes (the Github actions bot changes already commits from feed URLs)
2. Run `make watchbuild` and ensure the site looks good -- kill it once verified
3. Run `make build` to perform cleanups
4. Run `make migrate` -- this will copy the legacy permalinks to the right place
5. Commit new changes, if any
6. Run `make publish` -- this will change the branch to gh-pages
7. Commit changes on the gh-pages branch
8. Publish with `git push`
