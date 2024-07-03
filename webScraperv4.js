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

function normalizeUrl(url) {
  const urlObject = new URL(url);
  urlObject.hash = ""; // Remove fragment identifiers
  let normalizedUrl = urlObject.toString();
  if (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  return normalizedUrl;
}

export async function scrapeBlog(
  inputUrl,
  aggregatedText = "",
  visitedLinks = new Set(),
  useWww = null
) {
  let originalUrl = normalizeUrl(ensureHttp(inputUrl));

  // Extract the domain name and TLD from the original URL
  const domainNameWithTLD = extractDomainNameWithTLD(originalUrl);

  // Initialize a queue for breadth-first search
  const queue = [];
  queue.push(originalUrl);

  try {
    while (queue.length > 0 && visitedLinks.size < 5) {
      const currentUrl = queue.shift();
      const normalizedCurrentUrl = normalizeUrl(currentUrl);

      if (visitedLinks.has(normalizedCurrentUrl)) {
        continue;
      }
      visitedLinks.add(normalizedCurrentUrl);

      const response = await axios.get(currentUrl);
      const $ = cheerio.load(response.data);

      if (useWww === null) {
        const hrefExample = $("a").first().attr("href");
        if (hrefExample) {
          const exampleUrl = new URL(hrefExample, currentUrl);
          useWww = exampleUrl.hostname.startsWith("www.");
          originalUrl = checkAndAdjustUrlFormat(originalUrl, useWww);
        }
      }

      const baseUrl = new URL(currentUrl).origin;
      console.log("Original URL: ", originalUrl);

      const links = [];
      $("a").each((index, element) => {
        let href = $(element).attr("href");
        if (href) {
          href = new URL(href, baseUrl).toString();
          href = checkAndAdjustUrlFormat(href, useWww);
          const normalizedHref = normalizeUrl(href);
          if (normalizedHref !== originalUrl) {
            // Skip the starting link
            links.push(normalizedHref);
          }
          //links.push(href);
        }
      });

      // Define the function to remove whitespace between tags
      function removeWhitespaceBetweenTags(html) {
        return html.replace(/>\s+</g, "><");
      }

      // Remove unwanted tags
      $("script, style, link, header, footer, noscript, svg, path").remove();

      // Remove class names and IDs
      $("[class]").removeAttr("class");
      $("[id]").removeAttr("id");
      $("[srcset]").removeAttr("srcset");

      let htmlContent = $.html().trim();
      htmlContent = removeWhitespaceBetweenTags(htmlContent);

      console.log("VISITED LINKS: ", visitedLinks);
      //aggregatedText += htmlContent + "\n\nEND OF ARTICLE\n\n";
      if (normalizedCurrentUrl !== originalUrl) {
        aggregatedText +=
          `\n\nURL: ${currentUrl}\n\n` + htmlContent + "\n\nEND OF ARTICLE\n\n";
      }

      for (const link of links) {
        if (
          !visitedLinks.has(link) &&
          link.startsWith(originalUrl) &&
          link !== originalUrl
        ) {
          queue.push(link);
        }
      }
    }

    return {
      originalUrl,
      domainNameWithTLD,
      aggregatedText,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      originalUrl,
      domainNameWithTLD,
      aggregatedText,
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
