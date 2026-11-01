# Builds a BM25 keyword index next to the semantic search index, so the search
# bar can catch exact and near word matches that embeddings miss.
#
# Configured under `semantic_search.keyword_search` in _config.yml. The browser
# side (js/hybrid-search.js) scores queries against this index and fuses the
# result with the semantic scores.
#
# Tokenisation must stay in sync with `tokenize` in js/hybrid-search.js.

require 'json'
require 'jekyll-semantic-search'

module KeywordSearch
  DEFAULTS = {
    'enabled' => true,
    'weight' => 0.3,            # share of the final score that comes from BM25
    'min_score' => 0.4,         # normalised BM25 needed to show a keyword-only match
    'k1' => 1.2,
    'b' => 0.75,
    'title_boost' => 3,         # title words count this many times
    'semantic_ceiling' => 0.69, # cosine treated as a perfect semantic match
    'extra_documents' => nil,   # _data file with extra (external) articles
    'file' => 'keyword-index.json'
  }.freeze

  STOPWORDS = %w[
    a about above after again against all am an and any are as at be because been before being below between both
    but by can could did do does doing down during each few for from further had has have having he her here hers
    herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on
    once only or other our ours ourselves out over own same she should so some such than that the their theirs them
    themselves then there these they this those through to too under until up very was we were what when where which
    while who whom why will with would you your yours yourself yourselves
  ].freeze

  module_function

  def config(site)
    semantic = site.config['semantic_search'] || {}
    user = semantic['keyword_search']
    user = { 'enabled' => user } if user == true || user == false
    DEFAULTS.merge(user || {})
  end

  def enabled?(site)
    semantic = Jekyll::SemanticSearch::Configuration.new(site.config)
    semantic.enabled? && config(site)['enabled'] != false
  end

  def index_path(site)
    output_dir = Jekyll::SemanticSearch::Configuration.new(site.config).output_dir
    File.join(output_dir, config(site)['file'])
  end

  # Two steps, so inflections of one word share a stem ("achieves" and
  # "achieve" both become "achiev"): drop a plural, then -ing / -ed / -e.
  def stem(word)
    word = if word.length > 4 && word.end_with?('ies') then word[0..-4] + 'y'
           elsif word.length > 4 && word.end_with?('sses') then word[0..-3]
           elsif word.length > 3 && word.end_with?('s') && !word.end_with?('ss', 'us', 'is') then word[0..-2]
           else word
           end
    if word.length > 5 && word.end_with?('ing') then word[0..-4]
    elsif word.length > 5 && word.end_with?('ed') then word[0..-3]
    elsif word.length > 4 && word.end_with?('e') then word[0..-2]
    else word
    end
  end

  CJK = /[\p{Han}\p{Hiragana}\p{Katakana}\u30FC]+/

  # Words are runs of letters, marks and digits in any script, lower-cased with
  # Latin/Greek/Cyrillic accents removed. Chinese and Japanese have no spaces
  # between words, so runs of those scripts become overlapping character pairs.
  def tokenize(text)
    text = text.to_s.unicode_normalize(:nfkd).downcase.gsub(/[\u0300-\u036F]/, '')
               .unicode_normalize(:nfc).tr('ς', 'σ')
    text.scan(/[\p{L}\p{M}\p{N}]+/).flat_map do |word|
      word.split(/(#{CJK})/).reject(&:empty?).flat_map do |part|
        if part.match?(/\A#{CJK}\z/)
          part.length == 1 ? [part] : part.chars.each_cons(2).map(&:join)
        elsif part.length < 2 || STOPWORDS.include?(part)
          []
        else
          [stem(part)]
        end
      end
    end
  end

  def documents(site, cfg)
    semantic = Jekyll::SemanticSearch::Configuration.new(site.config)
    baseurl = site.baseurl.to_s.chomp('/')
    docs = semantic.collections.flat_map { |label| site.collections[label]&.docs || [] }
    docs = docs.select { |d| d.data['semantic_search'] != false && d.data['published'] != false && d.write? }
    posts = docs.map do |d|
      { url: "#{baseurl}#{d.url}", title: d.data['title'].to_s,
        body: Jekyll::SemanticSearch::TextExtractor.extract(d.content) }
    end
    extra = cfg['extra_documents'] ? Array(site.data[cfg['extra_documents']]) : []
    posts + extra.map do |a|
      { url: a['url'], title: a['title'].to_s, body: a['description'].to_s, external: true }
    end
  end

  def build(site)
    cfg = config(site)
    docs = []
    postings = Hash.new { |h, k| h[k] = {} }
    documents(site, cfg).each_with_index do |doc, i|
      tokens = tokenize(doc[:body]) + tokenize(doc[:title]) * cfg['title_boost'].to_i
      tokens.tally.each { |term, tf| postings[term][i] = tf }
      docs << { url: doc[:url], title: doc[:title], len: tokens.size, external: doc[:external] }.compact
    end
    {
      params: cfg.slice('weight', 'min_score', 'k1', 'b', 'semantic_ceiling'),
      stopwords: STOPWORDS,
      avgdl: docs.sum { |d| d[:len] }.fdiv([docs.size, 1].max).round(2),
      docs: docs,
      # term => [doc index, tf, doc index, tf, ...]
      terms: postings.sort.to_h { |term, tfs| [term, tfs.flatten] }
    }
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  next unless KeywordSearch.enabled?(site)

  index = KeywordSearch.build(site)
  path = site.in_dest_dir(KeywordSearch.index_path(site))
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, JSON.generate(index))
  Jekyll.logger.info 'Keyword Search:', "Indexed #{index[:docs].size} documents (#{index[:terms].size} terms)"
end

# Exposes the index URL to layouts as `site.keyword_search_index_url` (unset
# when keyword search is disabled), for the search bar's data attribute.
class KeywordSearchConfig < Jekyll::Generator
  safe true

  def generate(site)
    return unless KeywordSearch.enabled?(site)

    site.config['keyword_search_index_url'] = "#{site.baseurl.to_s.chomp('/')}/#{KeywordSearch.index_path(site)}"
  end
end
