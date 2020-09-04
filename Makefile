build:
	bundle exec jekyll b && rm _site/Makefile
watchbuild:
	bundle exec jekyll s
migrate:
	_scripts/migrate-permalinks-pre-commit-hook
publish: build migrate
	git checkout gh-pages && rm -rf about assets contact css images js non-tech tech hidden && git checkout master -- _site && mv _site/* . && git rm -rf _site && rm -rf hidden 
