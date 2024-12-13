#!/usr/bin/env bash

rm -rf /tmp/_site ; 
mv _site /tmp/_site ;
git checkout gh-pages ;
cp -R /tmp/_site/* . ;
rm -rf hidden
rm Gemfile;
rm Gemfile.lock;
rm LICENCE.md