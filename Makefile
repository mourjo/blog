build:
	bundle exec jekyll b 
watchbuild:
	bundle exec jekyll s
publish:
	 _scripts/publish.sh
deploy:
	 ./deploy.sh
copy_from_obsidian:
	_scripts/copy_from_obsidian.sh
