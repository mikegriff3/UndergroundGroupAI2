const contentElement = document.getElementById("ai-content");

function renderContent(data) {
  // Clear existing content
  contentElement.innerHTML = "";

  // Render Overall Grade Section
  renderSection(
    "Overall Grade",
    data.overallGrade.rating,
    data.overallGrade.feedback,
    data.overallGrade.suggestions
  );

  //Target Audience Section
  //Target Audience Title
  const targetAudienceTitleElement = document.createElement("div");
  targetAudienceTitleElement.textContent = "Target Audience and SEO Keywords";
  targetAudienceTitleElement.style.fontSize = "20px";
  targetAudienceTitleElement.style.color = "#ee5535";
  contentElement.appendChild(targetAudienceTitleElement);
  // Append hr element after the section
  const hrElement = document.createElement("hr");
  contentElement.appendChild(hrElement);
  contentElement.appendChild(document.createElement("br"));

  //Target Audience
  const targetAudienceElement = document.createElement("div");
  targetAudienceElement.textContent = "Target Audience: " + data.targetAudience;
  contentElement.appendChild(targetAudienceElement);
  contentElement.appendChild(document.createElement("br"));

  //SEO Keywords Title
  const keywordsTitleElement = document.createElement("div");
  keywordsTitleElement.textContent = "Top SEO Keywords for Target Audience";
  keywordsTitleElement.style.textDecoration = "underline";
  contentElement.appendChild(keywordsTitleElement);

  //SEO Keywords
  for (let i = 0; i < data.keywords.length; i++) {
    const suggestion = document.createElement("div"); // Create a div element
    suggestion.textContent = `${i + 1}. ${data.keywords[i]}`; // Set div content with item number
    contentElement.appendChild(suggestion); // Append div to the body (you can change this to any other element)
  }
  contentElement.appendChild(document.createElement("br"));
  contentElement.appendChild(document.createElement("br"));

  // Render Readability Grade Section
  renderSection(
    "Readability",
    data.readability.rating,
    data.readability.feedback,
    data.readability.suggestions
  );

  // Render Topic Authority Grade Section
  renderSection(
    "Topic Authority",
    data.topicAuthority.rating,
    data.topicAuthority.feedback,
    data.topicAuthority.suggestions
  );

  // Render External Linking Grade Section
  renderSection(
    "External Linking",
    data.externalLinking.rating,
    data.externalLinking.feedback,
    data.externalLinking.suggestions
  );

  // Render Meta Tags Grade Section
  renderSection(
    "Meta Tags",
    data.metaTags.rating,
    data.metaTags.feedback,
    data.metaTags.suggestions
  );
}

function renderSection(title, rating, feedback, suggestions) {
  // Create section container
  const sectionContainer = document.createElement("div");
  sectionContainer.style.display = "flex";
  sectionContainer.style.flexDirection = "column";
  sectionContainer.style.alignItems = "flex-start";
  sectionContainer.style.justifyContent = "flex-end"; // Align items to the end (bottom)
  sectionContainer.style.height = "100%"; // Set height to occupy parent's height
  contentElement.appendChild(sectionContainer);

  // Create container for title and rating
  const titleRatingContainer = document.createElement("div");
  titleRatingContainer.style.display = "flex";
  titleRatingContainer.style.justifyContent = "space-between"; // Align items with space between them
  titleRatingContainer.style.alignItems = "flex-end"; // Align items to the bottom
  titleRatingContainer.style.width = "100%"; // Take full width
  sectionContainer.appendChild(titleRatingContainer);

  // Create title element
  const titleElement = document.createElement("div");
  titleElement.textContent = title;
  titleElement.style.fontSize = "20px";
  titleElement.style.color = "#ee5535";
  titleRatingContainer.appendChild(titleElement);

  // Create container for rating with border
  const ratingContainer = document.createElement("div");
  ratingContainer.style.border = "1px solid #ccc";
  ratingContainer.style.padding = "10px";
  ratingContainer.style.marginLeft = "auto"; // Move rating to the far right

  // Set background color based on rating
  if (rating >= 9) {
    ratingContainer.style.backgroundColor = "green";
  } else if (rating >= 7) {
    ratingContainer.style.backgroundColor = "lightgreen";
  } else if (rating >= 5) {
    ratingContainer.style.backgroundColor = "orange";
  } else {
    ratingContainer.style.backgroundColor = "red";
  }

  titleRatingContainer.appendChild(ratingContainer);

  // Create rating element
  const ratingElement = document.createElement("div");
  ratingElement.textContent = rating;
  ratingElement.style.fontSize = "26px";
  ratingElement.style.color = "white";
  ratingContainer.appendChild(ratingElement);

  // Append hr element after the section
  const hrElement = document.createElement("hr");
  contentElement.appendChild(hrElement);
  contentElement.appendChild(document.createElement("br"));

  // Create feedback element
  const feedbackElement = document.createElement("div");
  feedbackElement.textContent = feedback;
  contentElement.appendChild(feedbackElement);
  contentElement.appendChild(document.createElement("br"));

  // Render suggestions
  const suggestionTitleElement = document.createElement("div");
  suggestionTitleElement.textContent = "Suggestions for Improvement";
  suggestionTitleElement.style.textDecoration = "underline";
  contentElement.appendChild(suggestionTitleElement);
  suggestions.forEach((suggestion, index) => {
    const suggestionElement = document.createElement("div");
    suggestionElement.textContent = `${index + 1}. ${suggestion}`;
    contentElement.appendChild(suggestionElement);
  });
  contentElement.appendChild(document.createElement("br"));
  contentElement.appendChild(document.createElement("br"));
}
