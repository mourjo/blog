module Jekyll
  module CustomFilters
    def remove_non_latin(input)
      # Regex to match only Latin characters and basic punctuation
      input.gsub(/[^a-zA-Z0-9\s]/, '')
    end

    def remove_stopwords(input)
      # Regex to match only Latin characters and basic punctuation
      words_to_remove = [
        "i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "ourselves",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "he",
        "him",
        "his",
        "himself",
        "she",
        "her",
        "hers",
        "herself",
        "it",
        "its",
        "itself",
        "they",
        "them",
        "their",
        "theirs",
        "themselves",
        "what",
        "which",
        "who",
        "whom",
        "this",
        "that",
        "these",
        "those",
        "am",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "having",
        "do",
        "does",
        "did",
        "doing",
        "a",
        "an",
        "the",
        "and",
        "but",
        "if",
        "or",
        "because",
        "as",
        "until",
        "while",
        "of",
        "at",
        "by",
        "for",
        "with",
        "about",
        "against",
        "between",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "to",
        "from",
        "up",
        "down",
        "in",
        "out",
        "on",
        "off",
        "over",
        "under",
        "again",
        "further",
        "then",
        "once",
        "here",
        "there",
        "when",
        "where",
        "why",
        "how",
        "all",
        "any",
        "both",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "s",
        "t",
        "can",
        "will",
        "just",
        "don",
        "should",
        "now",
        "should",
        "in",
        "had",
        "not",
        "very",
        "where",
        "it",
        "must",
        "its",
        "is",
        "was",
        "us",
        "one",
        "would",
        "life",
        "time",
        "like",
        "even",
        "never",
        "people",
        "every",
        "day",
        "back",
        "things",
        "much",
        "could"
      ]

      for w in words_to_remove
          input = input.gsub(/\b#{w}\b/i, "")
      end
      
      input.strip
    end
  end
end

Liquid::Template.register_filter(Jekyll::CustomFilters)
