# OG Image Creator

"OG Image Creator is a tool for fast and beautiful OG image generation — just one URL needed."

![og-image.png](og-image.png)

Generate beautiful OG-images (Open Graph images) for any web page or specific element, using your own HTML template.

This utility was developed for [https://todaysdatenow.com/](https://todaysdatenow.com/) — but can be used for any site.

---

## Features

- Capture screenshots of a specific element or full page (default: full page)
- Flexible mobile/desktop emulation
- Injects screenshot, title, description, domain, favicon into your own HTML OG-image template
- Command-line arguments for all options (URL, selector, title, description, favicon, template, etc.)
- Automatically fetches `<title>` and `<meta name="description">` from the target page if not provided
- Easy to integrate into automation pipelines

---

## Install

```bash
npm install puppeteer yargs
````

---

## Usage

```bash
node og-image-creator.js \
  --url "https://todaysdatenow.com/" \
  --selector "main" \
  --favicon "favicon.png" \
  --title "My OG Title" \
  --description "Open Graph Image for My Page" \
  --template "og-template.html" \
  --output "og-image.png" \
  --mobile
```

### Required arguments

* `--url` - target page URL

### Optional arguments

* `--selector` - CSS selector for element screenshot (default: `body`, meaning full page)
* `--favicon` - path to favicon file (`favicon.png`) (default: `favicon.png`)
* `--title` - OG Title (if omitted, taken from `<title>`)
* `--description` - OG Description (if omitted, taken from `<meta name="description">`)
* `--template` - HTML OG-image template (default: `og-template.html`)
* `--output` - path to output OG-image (default: `og-image.png`)
* `--mobile` - enable mobile device emulation

---

## Template example

**`og-template.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{TITLE}}</title>
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body>
  <div>
    <div class="flex flex-col w-[1200px] h-[630px] bg-[#2154BF] text-[#fff] text-center">
      <div class="flex flex-col p-4 pb-0 gap-2 my-auto">
        <div class="text-4xl font-bold px-2 px-4 line-clamp-1">{{TITLE}}</div>
        <div class="text-xl px-5 mx-auto pb-0 py-0 line-clamp-1">{{DESCRIPTION}}</div>
        <div class="flex flex-row gap-2 mx-auto mb-2">
          <div class="flex my-auto">
            {{FAVICON}}
          </div>
          <div class="flex text-lg font-medium my-auto">{{DOMAIN}}</div>
        </div>
      </div>
      <div class="flex grow"></div>
      <div class="flex w-[80%] mx-auto overflow-hidden rounded-t-xl shadow-xl">
        <figure class="w-full">{{IMG}}</figure>
      </div>
    </div>
  </div>
</body>
</html>
```

**Template placeholders**

* `{{TITLE}}` — OG title (from argument or `<title>`)
* `{{DESCRIPTION}}` — OG description (from argument or meta tag)
* `{{DOMAIN}}` — domain of the target URL
* `{{FAVICON}}` — favicon image tag
* `{{IMG}}` — screenshot image tag

---

## Notes

* The script was originally created for [todaysdatenow.com](https://todaysdatenow.com/), but is suitable for any project.
* For mobile screenshots, use the `--mobile` flag.
* All image paths are resolved as absolute `file://...` for correct local rendering in Puppeteer.
* Temporary files and screenshots are automatically cleaned up after use.

---

## License

MIT
