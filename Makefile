build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
publish: build
	 _scripts/publish.sh