from bs4 import BeautifulSoup
import re


# ***************
# using venv
# ***************
# python3 -m venv _scripts/venv
# source _scripts/venv/bin/activate
# pip freeze > _scripts/requirements.txt
# pip install -r _scripts/requirements.txt
# deactivate


def extract_words_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    for tag in soup.find_all(True):
        tag.insert_before(" ")
        tag.unwrap()

    text = ' '.join(soup.get_text().split())
    
    
    words = re.findall(r'\b\w+\b', text)
    return re.sub(r'[^a-zA-Z0-9\s]','', text)


html_content = """
In our journey with Elasticsearch in production, we have learned quite a few things. 
We are writing this post to share our experience and the knowledge we gained in providing realtime, 
robust autocompletions as a means to assist the user what to search for.
"""

# Extract words
words = extract_words_from_html(html_content).lower()
small_words = ' '.join([s for s in set(words.split()) if len(s) <= 8 and len(s) >= 1])

# Print results
print(small_words)