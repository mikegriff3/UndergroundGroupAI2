import axios from "axios";
import cheerio from "cheerio";

function ensureHttp(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

function checkAndAdjustUrlFormat(url, useWww) {
  const urlObject = new URL(url);
  if (useWww && !urlObject.hostname.startsWith("www.")) {
    urlObject.hostname = `www.${urlObject.hostname}`;
    return urlObject.toString();
  } else if (!useWww && urlObject.hostname.startsWith("www.")) {
    urlObject.hostname = urlObject.hostname.substring(4);
    return urlObject.toString();
  }
  return url;
}

export async function scrapeBlog(
  inputUrl,
  aggregatedText = "",
  visitedLinks = new Set(),
  aggregatedMetaTags = "",
  pageCount = 0,
  useWww = null
) {
  const originalUrl = inputUrl; // Store the original URL before any modifications
  let url = ensureHttp(inputUrl);

  // Extract the domain name and TLD from the original URL
  const domainNameWithTLD = extractDomainNameWithTLD(url);

  try {
    if (visitedLinks.has(url) || visitedLinks.size >= 20) {
      return {
        originalUrl,
        domainNameWithTLD,
        aggregatedText,
        aggregatedMetaTags,
      };
    }
    visitedLinks.add(url);
    pageCount++;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    if (useWww === null) {
      const hrefExample = $("a").first().attr("href");
      if (hrefExample) {
        const exampleUrl = new URL(hrefExample, url);
        useWww = exampleUrl.hostname.startsWith("www.");
        url = checkAndAdjustUrlFormat(url, useWww);
      }
    }

    const baseUrl = new URL(url).origin;

    const links = [];
    $("a").each((index, element) => {
      let href = $(element).attr("href");
      if (href) {
        href = new URL(href, baseUrl).toString();
        href = checkAndAdjustUrlFormat(href, useWww);
        links.push(href);
      }
    });

    const textContent = $("p").text().trim();
    const metaTags = $("meta").toString();

    console.log("VISITED LINKS: ", visitedLinks);
    console.log(`URL: ${url}`);
    aggregatedText += textContent + "\n\n";
    aggregatedMetaTags += metaTags + "\n\n";

    for (const link of links) {
      if (visitedLinks.size >= 20) {
        break;
      }
      if (link && link.startsWith(url)) {
        const { aggregatedText: newText, aggregatedMetaTags: newMetaTags } =
          await scrapeBlog(
            link,
            aggregatedText,
            visitedLinks,
            aggregatedMetaTags,
            pageCount + 1,
            useWww
          );
        aggregatedText = newText;
        aggregatedMetaTags = newMetaTags;
      }
    }
    return {
      originalUrl,
      domainNameWithTLD,
      aggregatedText,
      aggregatedMetaTags,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      originalUrl,
      domainNameWithTLD,
      aggregatedText,
      aggregatedMetaTags,
    };
  }
}

function extractDomainNameWithTLD(url) {
  const urlObject = new URL(url);
  const parts = urlObject.hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return urlObject.hostname; // In case the URL does not follow the usual format
}
