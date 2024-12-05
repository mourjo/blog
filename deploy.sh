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



make build;
git add .;
git commit -m "$MSG - build";

make migrate;
git add .;
git commit -m "$MSG - migrate";

make publish;
git add .;
git commit -m "$MSG - publish";

git push;

git checkout master;

git push;
