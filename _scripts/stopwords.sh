#!/bin/bash

API_URL="https://raw.githubusercontent.com/mourjo/blog/refs/heads/gh-pages/search.json"

# Fetch JSON data
JSON_DATA=$(curl -s "$API_URL")

echo "$JSON_DATA" | \
    jq -r '.' | \
    grep -oE '\w+' | \
    tr '[:upper:]' '[:lower:]' | \
    sort | \
    uniq -c | \
    sort -rn | \
    awk '{print $2}' | \
    head -100
