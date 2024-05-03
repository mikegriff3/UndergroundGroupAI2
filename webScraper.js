import axios from "axios";
import cheerio from "cheerio";

export async function scrapeBlog(
  url,
  aggregatedText = "",
  visitedLinks = new Set(),
  aggregatedMetaTags = "",
  pageCount = 0 // Initialize pageCount here
) {
  try {
    if (visitedLinks.has(url) || pageCount >= 20) {
      return { aggregatedText, aggregatedMetaTags }; // Exit if the URL has already been visited to avoid infinite loop
    }
    visitedLinks.add(url);
    pageCount++;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract base URL from the provided URL
    const baseUrl = new URL(url).origin;
    //console.log("BASE URL:", baseUrl);

    // Extract all links from the page
    const links = [];
    $("a").each((index, element) => {
      const href = $(element).attr("href");
      if (href) {
        const absoluteUrl = new URL(href, baseUrl).toString();
        //console.log("ABSOLUTE URL", absoluteUrl);
        links.push(absoluteUrl);
      }
    });
    //Extract all links from the page
    // const links = [];
    // $("a").each((index, element) => {
    //   links.push($(element).attr("href"));
    // });

    // Extract text content from the current page
    const textContent = $("p").text().trim();
    const metaTags = $("meta").toString();

    // Output the text content of the current page
    console.log("VISITED LINKS: ", visitedLinks);
    console.log(`URL: ${url}`);
    //console.log(textContent);
    //console.log("---------------------------");
    aggregatedText += textContent + "\n\n";
    aggregatedMetaTags += metaTags + "\n\n";
    //console.log("META TAGS: ", aggregatedMetaTags);

    // Recursively scrape each linked page with a delay
    for (const link of links) {
      if (link && link.startsWith(url)) {
        const { aggregatedText: newText, aggregatedMetaTags: newMetaTags } =
          await scrapeBlog(
            link,
            aggregatedText,
            visitedLinks,
            aggregatedMetaTags,
            pageCount + 1 // Increment pageCount during recursion
          );
        aggregatedText = newText;
        aggregatedMetaTags = newMetaTags;
      }
    }
    return { aggregatedText, aggregatedMetaTags };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { aggregatedText, aggregatedMetaTags };
  }
}
