import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const FAVICON_SIZE = 40;

const argv = yargs(hideBin(process.argv))
  .option("url", { type: "string", demandOption: true, describe: "Target URL" })
  .option("selector", {
    type: "string",
    default: "body",
    describe: "Selector for element screenshot",
  })
  .option("favicon", {
    type: "string",
    describe: "Path to favicon (favicon.png)",
  })
  .option("title", { type: "string", describe: "OG Title" })
  .option("description", {
    type: "string",
    describe: "OG Description",
  })
  .option("template", {
    type: "string",
    default: "og-template.html",
    describe: "HTML template",
  })
  .option("output", {
    type: "string",
    default: "og-image.png",
    describe: "OG image output",
  })
  .option("temp", {
    type: "string",
    default: "temp-og.html",
    describe: "Temp HTML file",
  })
  .option("clipimg", {
    type: "string",
    default: "element.png",
    describe: "Element screenshot file",
  })
  .option("mobile", {
    type: "boolean",
    default: false,
    describe: "Mobile screenshot",
  })
  .help().argv;

async function screenshotElement(url, selector, outPath) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  if (argv.mobile) {
    await page.emulate({
      viewport: {
        width: 430,
        height: 600,
        isMobile: true,
        deviceScaleFactor: 3,
        hasTouch: true,
      },
    });
  } else {
    await page.emulate({
      viewport: {
        width: 1200,
        height: 800,
        isMobile: false,
        deviceScaleFactor: 1,
        hasTouch: false,
      },
    });
  }
  await new Promise((res) => setTimeout(res, 1000));

  const meta = await page.evaluate(() => {
    const title = document.title || "";
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc ? metaDesc.content : "";
  
    const links = Array.from(document.querySelectorAll('link[rel*="icon"][href], link[rel*="apple-touch-icon"][href]'));
    const priority = ['png', 'svg', 'jpg', 'jpeg', 'webp', "ico"];
    let favicon = null;
  
    for (const ext of priority) {
      const l = links.find(link =>
        link.href && link.href.toLowerCase().includes(`.${ext}`)
      );
      if (l) {
        favicon = l.href;
        break;
      }
    }
  
    if (!favicon && links.length) {
      favicon = links[0].href;
    }
  
    return { title, description, favicon };
  });

    let faviconPath = null;
    if (meta.favicon) {
      try {
        const faviconUrl = new URL(meta.favicon, url).href;
        const res = await fetch(faviconUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const ext = faviconUrl.split('.').pop().split(/\#|\?/)[0].toLowerCase();
          if (["png", "jpg", "jpeg", "svg", "webp", "ico"].includes(ext)) {
            faviconPath = `favicon.${ext}`;
            await fs.writeFile(faviconPath, buffer);
          }
        }
      } catch (e) {
        faviconPath = null;
      }
    }

  const el = await page.waitForSelector(selector, {
    visible: true,
    timeout: 10000,
  });
  if (!el) throw new Error("Element not found");
  const box = await el.boundingBox();
  if (!box) throw new Error("Bounding box not found");
  await page.screenshot({ path: outPath, clip: box });
  await browser.close();
  return {
    title: meta.title,
    description: meta.description,
    faviconPath,
  };
}

async function generateOgImage({
  templatePath,
  imgPath,
  faviconPath,
  ogOutPath,
  tempHtml,
  title,
  description,
  url,
}) {
  let template = await fs.readFile(templatePath, "utf-8");
  template = template
    .replace(
      "{{IMG}}",
      `<img src="file://${path.resolve(
        imgPath
      )}" class="shadow-2xl" alt="element">`
    )
    .replace("{{TITLE}}", title)
    .replace("{{DESCRIPTION}}", description ? `<div class="text-2xl text-center px-32 mx-auto pb-0 my-4 line-clamp-2">${description}</div>` : "")
    .replace(
      "{{FAVICON}}",
      faviconPath
        ? `<div class="flex my-auto"><img src="file://${path.resolve(faviconPath)}" alt="icon" style="height:${FAVICON_SIZE}px;width:${FAVICON_SIZE}px;display:inline-block;"></div>`
        : ""
    )
    .replace("{{DOMAIN}}", new URL(url).hostname);

    console.log(template);
  await fs.writeFile(tempHtml, template, "utf-8");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve(tempHtml);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1200, height: 630 });
  await page.screenshot({ path: ogOutPath });
  await browser.close();
  await fs.unlink(tempHtml);
  await fs.unlink(imgPath);
  await fs.unlink(faviconPath);
}



(async () => {
  let title = argv.title;
  let description = argv.description;
  let faviconPath = argv.favicon;
  let meta = { title: "", description: "", faviconPath: "" };

  meta = await screenshotElement(argv.url, argv.selector, argv.clipimg);

  if (!title) title = meta.title;
  if (!description) description = meta.description;
  if (!faviconPath) faviconPath = meta.faviconPath;

  await generateOgImage({
    templatePath: argv.template,
    imgPath: argv.clipimg,
    ogOutPath: argv.output,
    tempHtml: argv.temp,
    faviconPath,
    title,
    description,
    url: argv.url,
  });
  console.log("🎉 OG-image is ready:", argv.output);
})();
