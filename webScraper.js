import axios from "axios";
import cheerio from "cheerio";

let pageCount = 0;

export async function scrapeBlog(
  url,
  aggregatedText = "",
  visitedLinks = new Set()
) {
  try {
    if (visitedLinks.has(url) || pageCount >= 20) {
      return aggregatedText; // Exit if the URL has already been visited to avoid infinite loop
    }
    visitedLinks.add(url);
    pageCount++;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract all links from the page
    const links = [];
    $("a").each((index, element) => {
      links.push($(element).attr("href"));
    });

    // Extract text content from the current page
    const textContent = $("p").text().trim();

    // Output the text content of the current page
    // console.log(`URL: ${url}`);
    // console.log(textContent);
    // console.log("---------------------------");
    aggregatedText += textContent + "\n\n";

    // Recursively scrape each linked page with a delay
    for (const link of links) {
      if (link && link.startsWith(url)) {
        aggregatedText = await scrapeBlog(link, aggregatedText, visitedLinks);
      }
    }
    return aggregatedText;
  } catch (error) {
    console.error("Error fetching data:", error);
    return aggregatedText;
  }
}

// Example usage:
// const blogUrl = "https://www.chasejarvis.com/blog/"; // Replace with the URL of the blog you want to scrape
// scrapeBlog(blogUrl)
//   .then((aggregatedText) => {
//     console.log("Aggregated Text:", aggregatedText);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
