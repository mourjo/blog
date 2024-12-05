import os
import re
import sys
import shutil
from pathlib import Path


# Paths
jekyll_posts_dir = "/Users/mourjo/repos/blog/_posts" # path in blog containing posts
attachments_dir = "/Users/mourjo/repos/transpire/attachments" # path in obsidian that contains the images
static_images_dir = "/Users/mourjo/repos/blog/images" # output image path in Jekyll
obsidian_posts_dir = "/Users/mourjo/repos/transpire/personal-notes/mourjo-me-blog/"

def from_obsidian(filename):
    if not(filename.endswith(".md")):
        print("Markdown file names must begin with .md")
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
                shutil.copy(image_source, image_output_path)

            markdown_image = f"[Image Description](/blog/images/{renamed_image})"
            content = content.replace(f"[[{image}]]", markdown_image)

        with open(output_filepath, "w") as file:
            file.write(content)

        print("Markdown files processed and images copied successfully.")

if len(sys.argv) != 2:
    print("Usage: python3 copy_from_obsidian.py path/to/obsidian_file.md")
else:
    from_obsidian(sys.argv[1])
