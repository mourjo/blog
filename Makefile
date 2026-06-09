build:
	bundle install && bundle exec jekyll b 
_watchbuild:
	bundle exec jekyll s
_publish:
	 _scripts/publish.sh
deploy:
	 ./deploy.sh
copy_from_obsidian:
	_scripts/copy_from_obsidian.sh
