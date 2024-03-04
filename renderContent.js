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
  contentElement.appendChild(document.createElement("br"));

  //Target Audience
  const targetAudienceElement = document.createElement("div");
  targetAudienceElement.textContent = "Target Audience: " + data.targetAudience;
  contentElement.appendChild(targetAudienceElement);

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

  // Append hr element after the section
  const hrElement = document.createElement("hr");
  contentElement.appendChild(hrElement);

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
  // Create section title element
  const titleElement = document.createElement("div");
  titleElement.textContent = title;
  titleElement.style.fontSize = "20px";
  titleElement.style.color = "#ee5535";
  contentElement.appendChild(titleElement);
  contentElement.appendChild(document.createElement("br"));

  // Create rating element
  const ratingElement = document.createElement("div");
  ratingElement.textContent = rating;
  ratingElement.style.fontSize = "26px";
  contentElement.appendChild(ratingElement);
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

  // Append hr element after the section
  const hrElement = document.createElement("hr");
  contentElement.appendChild(hrElement);
}
