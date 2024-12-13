module Jekyll
  module CustomFilters
    def remove_non_latin(input)
      # Regex to match only Latin characters and basic punctuation
      input.gsub(/[^a-zA-Z0-9\s.,!?]/, '')
    end
  end
end

Liquid::Template.register_filter(Jekyll::CustomFilters)
