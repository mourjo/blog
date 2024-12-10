module Jekyll
  class ObsidianCalloutsConverter < Jekyll::Generator
    safe true

    # Generate is the main method that processes each page and post
    def generate(site)
      site.pages.each { |page| process_content(page) }
      site.posts.docs.each { |post| process_content(post) }
    end

    private

    # This method finds and converts Obsidian callouts in a page or post
    def process_content(document)
      return unless document.content

      # Regular expression to match Obsidian callouts
      callout_regex = /^> \[!(?<type>\w+)\] ?(?<title>.+)?\n(?<content>(?:> .+\n?)+)/

      # Replace the matched callout syntax with custom HTML
      document.content = document.content.gsub(callout_regex) do |match|
        type = Regexp.last_match[:type].downcase
        title = Regexp.last_match[:title]&.strip || ""
        content = Regexp.last_match[:content].gsub(/^> /, "").strip
        puts "ObsidianCalloutsConverter - Replacing Obsidian Callouts"
       
        # Generate the custom HTML for the callout
        <<~HTML
          <div class="callout callout-#{type}">
            #{"<div class=\"callout-title\">#{title}</div>" unless title.empty?}
            <div class="callout-content">#{content}</div>
          </div>
        HTML
      end
    end
  end
end

