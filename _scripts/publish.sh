#!/usr/bin/env bash

git fetch origin;
bundle exec jekyll b;
TMP_DIR="/tmp/blog/$(date  +%Y_%m_%d_%H_%M_%S)__$(git rev-parse --short HEAD)"
mkdir -p "$TMP_DIR"
mv _site "$TMP_DIR"
git checkout gh-pages
cp -r "$TMP_DIR/_site/" .
rm -rf hidden
rm -rf Gemfile
rm -rf Gemfile.lock
rm -rf LICENCE.md
