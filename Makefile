build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
migrate:
	_scripts/migrate-permalinks-pre-commit-hook
updatefeed: build
	git add _site/feed.xml && git commit -m "Update feed.xml" 
publish: build updatefeed migrate
	git checkout gh-pages && rm -rf about assets contact css images js non-tech tech hidden mentoring && git checkout master -- _site && mv _site/* . && git rm -rf _site && rm -rf hidden 
