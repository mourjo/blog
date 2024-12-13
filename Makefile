build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
migrate:
	_scripts/migrate-permalinks-pre-commit-hook
updatefeed: build
	git add _site/feed.xml && git commit -m "Update feed.xml" 
publish: build updatefeed migrate
    rm -rf /tmp/_site && mv _site /tmp/_site && git checkout gh-pages && cp -R /tmp/_site/* . && rm hidden
