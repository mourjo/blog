#!/usr/bin/env bash

git fetch origin;

TMP_DIR="/tmp/blog/$(date  +%Y_%m_%d_%H_%M_%S)__$(git rev-parse --short HEAD)"
mv _site TMP_DIR
git checkout gh-pages
echo cp -R "/tmp/blog/$TMP_DIR/*" .
rm -rf hidden
rm -rf Gemfile
rm -rf Gemfile.lock
rm -rf LICENCE.md