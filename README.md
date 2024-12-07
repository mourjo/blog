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
