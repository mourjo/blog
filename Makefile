build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
migrate:
	_scripts/migrate-permalinks-pre-commit-hook
updatefeed: build
	git add _site/feed.xml && git commit -m "Update feed.xml" 
publish: build updatefeed migrate
	 _scripts/publish.sh