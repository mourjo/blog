# Keep posts in the "hidden" category out of the semantic search index.
class SemanticSearchExclusions < Jekyll::Generator
  safe true
  priority :highest

  def generate(site)
    site.posts.docs.each do |post|
      post.data['semantic_search'] = false if Array(post.data['categories']).include?('hidden')
    end
  end
end
