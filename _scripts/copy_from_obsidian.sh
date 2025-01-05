#!/usr/bin/env bash

python3 -m venv _scripts/venv
source _scripts/venv/bin/activate
pip install -r _scripts/requirements.txt
python3 copy_from_obsidian.py
deactivate
