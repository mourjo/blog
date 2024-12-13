#!/usr/bin/env bash

git fetch origin;

rm -rf /tmp/_site ; 
mv _site /tmp/_site ;
git checkout gh-pages ;
cp -R /tmp/_site/* . ;
rm -rf hidden
rm -rf Gemfile;
rm -rf Gemfile.lock;
rm -rf LICENCE.md;