#!/usr/bin/env bash
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Check if the branch is not "master"
if [[ "$current_branch" != "master" ]]; then
  echo "Error: You are on branch '$current_branch'. Please switch to 'master' to proceed."
  exit 1
fi

MSG=$(git --no-pager log -1 --pretty=%B)
echo "This will build the blog, assumes latest commit contains the blog post.";
echo "The latest commit is:";
echo -e "\033[34m$MSG\033[0m";
echo "";
echo "Type 'y' to proceed";

while true; do
    read -r input
    if [[ "$input" == "y" ]]; then
        echo "Proceeding..."
        break
    else
        echo "Invalid input. Exiting";
        exit 0;
    fi
done


echo -e "\033[33m\n\n==========================================================\nBuilding\n==========================================================\n\n\033[0m";
make build;
git add .;
git commit -m "$MSG - build";

echo -e "\033[33m\n\n==========================================================\nPublishing\n==========================================================\n\n\033[0m";
make publish;
git add .;
git commit -m "$MSG - publish";

echo -e "\033[33m\n\n==========================================================\nPushing master\n==========================================================\n\n\033[0m";
git push;
git checkout master;
git push;

main_site_dir="$HOME/repos/mourjo.github.io/";

if [ -d $main_site_dir ]; then
  git checkout master;
  echo -e "\033[33m\n\n==========================================================\nCopying site-map and robots.txt to main site\n==========================================================\n\n\033[0m";
  git show gh-pages:robots.txt > robots.txt;
  git show gh-pages:sitemap.xml > sitemap.xml;
  cp robots.txt "$main_site_dir";
  mv sitemap.xml "$main_site_dir";
  cd  "$main_site_dir";
  git add robots.txt;
  git add sitemap.xml;
  git add resources;
  git commit -m "$MSG - Updating robots and sitemap";
  git push;
else
  echo -e "\033[31mUnable to sync changes to main site - maybe the directory does not exist: ~/repos/mourjo.github.io.\033[0m"
fi
