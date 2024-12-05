#!/usr/bin/env bash

MSG=$(git --no-pager log -1 --pretty=%B)
echo "This will build the blog, assumes initial commit contains the addition of the blog post.";
echo "Type 'y' to proceed";

while true; do
    read -r input
    if [[ "$input" == "y" ]]; then
        echo "Thank you! Proceeding..."
        break
    else
        echo "Invalid input. Exiting";
        exit 0;
    fi
done


echo "$MSG";

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
