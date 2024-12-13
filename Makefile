build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
updatefeed: build
	git add _site/feed.xml && git commit -m "Update feed.xml" 
publish: build updatefeed
	 _scripts/publish.sh