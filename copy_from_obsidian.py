#!/usr/bin/env python3


import os
import re
import sys
import shutil
from pathlib import Path
from PIL import Image, ImageOps

# ***************
# using venv
# ***************
# python3 -m venv _scripts/venv
# source _scripts/venv/bin/activate
# # commented pip freeze > _scripts/requirements.txt
# pip install -r _scripts/requirements.txt
# deactivate


# Paths
jekyll_posts_dir = "/Users/mourjo/repos/blog/_posts" # path in blog containing posts
attachments_dir = "/Users/mourjo/repos/transpire/attachments" # path in obsidian that contains the images
static_images_dir = "/Users/mourjo/repos/blog/images" # output image path in Jekyll
obsidian_posts_dir = "/Users/mourjo/repos/transpire/personal-notes/mourjo-me-blog/"

def compress_image(input_path, output_path, quality=85):
    # Open the image
    img = Image.open(input_path)

    img = ImageOps.exif_transpose(img)

    width, height = img.size
    ratio = 1200 / width
    new_width = int(width * ratio)
    new_height = int(height * ratio)

    resized_img = img.resize((new_width, new_height))

    # Save the image with reduced quality (you can adjust the quality from 0 to 100)
    resized_img.save(output_path, quality=quality)

def select_file_in_directory(directory):

    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a valid directory.")
        return None

    # List files in the directory
    files = sorted([f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))], reverse=True)

    if not files:
        print(f"No files found in directory: {directory}")
        return None

    # Display files and let the user select one
    print("Available files:")
    for index, file in enumerate(files, start=1):
        print(f"{index}: {file}")

    while True:
        try:
            choice = int(input("Enter the number of the file you want to select (or 0 to cancel): "))
            if choice == 0:
                print("No file selected.")
                return None
            elif 1 <= choice <= len(files):
                selected_file = files[choice - 1]
                return os.path.join(directory, selected_file)
            else:
                print("Invalid choice. Please enter a valid number.")
        except ValueError:
            print("Invalid input. Please enter a number.")
        except KeyboardInterrupt:
            return None
    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a valid directory.")
        return None


def from_obsidian(filename):
    if filename is None:
       print("\nNo file found")
    elif not(filename.endswith(".md")):
        print("\nMarkdown file names must begin with .md")
    else:
        filename = Path(filename).name
        input_filepath = os.path.join(obsidian_posts_dir, filename)
        output_filepath = os.path.join(jekyll_posts_dir, filename)

        with open(input_filepath, "r") as file:
            content = file.read()

        image_count = 1

        matching_images = re.findall(r'\[\[(([^]]*\.)(jpeg|svg|png|jpg))\]\]', content)
        images = map(lambda img_matches: img_matches[0], matching_images)
        images = sorted(images)

        filename_without_path = os.path.basename(filename)
        filename_without_ext = filename_without_path[:filename_without_path.rfind(".")]


        for image in images:

            index = image.rfind(".")
            before = image[:index]

            after = image[(index + 1):]

            renamed_image = filename_without_ext + "-" + str(image_count) + "." + after
            image_count = image_count + 1

            image_source = os.path.join(attachments_dir, image)
            if os.path.exists(image_source):
                image_output_path = os.path.join(static_images_dir, renamed_image)
                print(f"Copying '{image}' as '{image_output_path}'")
                compress_image(image_source, image_output_path)
                # shutil.copy(image_source, image_output_path)

            markdown_image = f"[Image Description](/blog/images/{renamed_image})"
            content = content.replace(f"[[{image}]]", markdown_image)

        with open(output_filepath, "w") as file:
            file.write(content)

        print("Markdown files processed and images copied successfully.")

if len(sys.argv) != 2:
    from_obsidian(select_file_in_directory(obsidian_posts_dir))
else:
    from_obsidian(sys.argv[1])
