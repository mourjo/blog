## Blog

My personal blog, published [here](https://mourjo.me/blog/).


### Install Jekyll
This uses an older version of Jekyll, the official docs use Ruby 3.0.0, but that doesn't
work for now.

```shell

brew install ruby
brew install rbenv
rbenv init

# Add to .zshrc:
# eval "$(rbenv init -)"
# export PATH=$PATH:$HOME/.gem/ruby/2.6.3/bin

# Install jekyll locally
gem install --user-install bundler jekyll

# Install gems
bundle install

# Test works
bundle exec jekyll serve
```

### Publishing
Make all chanegs on any branch other than `gh-pages`.
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
