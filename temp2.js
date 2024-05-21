function renderContent(data) {
  if (data.readability["Flesch Reading Ease Score (FRES)"] >= 90) {
    data.readability.fresLevel = "5th Grade Level";
  } else if (data.readability["Flesch Reading Ease Score (FRES)"] >= 80) {
    data.readability.fresLevel = "6th Grade Level";
  } else if (data.readability["Flesch Reading Ease Score (FRES)"] >= 70) {
    data.readability.fresLevel = "7th Grade Level";
  } else if (data.readability["Flesch Reading Ease Score (FRES)"] >= 60) {
    data.readability.fresLevel = "8th & 9th Grade Level";
  } else if (data.readability["Flesch Reading Ease Score (FRES)"] >= 50) {
    data.readability.fresLevel = "High School Level";
  } else if (data.readability["Flesch Reading Ease Score (FRES)"] >= 30) {
    data.readability.fresLevel = "College Student Level";
  } else {
    data.readability.fresLevel = "College Graduate Level";
  }

  const contentElement = document.getElementById("ai-content");
  // Clear existing content
  contentElement.innerHTML = "";

  const accordionItem = document.createElement("div");
  accordionItem.innerHTML = `
<div class="accordion js-accordion">
  <div class="accordion__item js-accordion-item ai-active">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>Overall</span>
        <i class="fa-solid fa-circle-info info-icon info-overall"></i>
        <!-- Modal Structure -->
        <div id="ovrModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">Overall Rating</div>
            <hr/>
            <p><strong>Definition:</strong> The Overall Rating represents a comprehensive evaluation of the website's content, encompassing its accuracy, relevancy, user engagement, readability, and technical quality. It reflects how well the content meets the needs and expectations of its intended audience.</p>

    <div class="modal-subtitle">Components:</div>
    <ol>
        <li><strong>Accuracy:</strong>
            <ul>
                <li>Assessment of Factual Correctness: Verifying the factual accuracy of the information provided, ensuring it is up-to-date and supported by credible sources.</li>
                <li>Expert Review: Involvement of subject matter experts to evaluate the content for industry-specific accuracy and adherence to best practices.</li>
            </ul>
        </li>
        <li><strong>Relevance:</strong>
            <ul>
                <li>Target Audience Alignment: Evaluation of how well the content addresses the interests and needs of its intended audience.</li>
                <li>Timeliness: Consideration of how current the content is, with updates and revisions as necessary to maintain its relevance.</li>
            </ul>
        </li>
        <li><strong>Engagement:</strong>
            <ul>
                <li>User Interaction: Analysis of how effectively the content engages users, including metrics like time on page, bounce rates, and user feedback.</li>
                <li>Visual and Interactive Elements: Use of multimedia, interactive tools, and visual aids to enhance user engagement and comprehension.</li>
            </ul>
        </li>
        <li><strong>Readability:</strong>
            <ul>
                <li>Language and Tone: Examination of the content’s clarity, tone, and use of language, ensuring it is appropriate for the audience’s reading level and preferences.</li>
                <li>Structure and Organization: Assessment of the content’s organization, use of headings, bullet points, and paragraphs to enhance readability and user navigation.</li>
            </ul>
        </li>
        <li><strong>Technical Quality:</strong>
            <ul>
                <li>SEO Optimization: Evaluation of the content’s optimization for search engines, including the use of keywords, meta tags, and alt texts.</li>
                <li>Accessibility: Ensuring the content is accessible to all users, including those with disabilities, by adhering to web accessibility standards.</li>
            </ul>
        </li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The Overall Rating would typically be calculated using a weighted average of the scores from each category. Each category could be graded on a scale (e.g., 1-10), and weights assigned based on the relative importance of each category for the specific website and its objectives.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This rating aims to provide a holistic view of the content's effectiveness and quality, guiding content creators in enhancing their offerings and informing users about the reliability and suitability of the content for their needs.</p>
          </div>
        </div>
      </div>
      <span class="header-chart" id="overall-chart"></span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="overall-feedchart-container">
          <div class="overall-feedback">
            <div class="accordion-subheader">Feedback</div>
            <div>
              ${data.overallGrade.Feedback}
            </div>
          </div>
          <div class="overall-area">
            <div id="area-chart"></div>
          </div>
        </div>
        <br />
        <div class="accordion-subheader">Suggestions for Improvement</div>
        <div>
          1. ${data.overallGrade["Suggestions for Improvement"][0]}
        </div>
        <div>
          2. ${data.overallGrade["Suggestions for Improvement"][1]}
        </div>
        <div>
          3. ${data.overallGrade["Suggestions for Improvement"][2]}
        </div>
        <div>
          4. ${data.overallGrade["Suggestions for Improvement"][3]}
        </div>
        <div>
          5. ${data.overallGrade["Suggestions for Improvement"][4]}
        </div>
      </div>
    </div>
  </div>
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>Target Audience & Keywords</span>
        <i class="fa-solid fa-circle-info info-icon info-targetAudience"></i>
        <!-- Modal Structure -->
        <div id="targetAudienceModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">Target Audience & Keywords Breakdown</div>
            <hr/>
            <p><strong>Definition:</strong> This category evaluates the effectiveness with which the content identifies and targets its intended audience, and how well it incorporates relevant SEO keywords that align with audience search behaviors. This dual focus ensures that the content not only reaches its specific demographic but also ranks well in search engines, making it easily discoverable by those most likely to find it valuable.</p>

    <div class="modal-subtitle">Key Aspects:</div>
    <ol>
        <li><strong>Identification of Target Audience:</strong>
            <ul>
                <li>Demographic and Psychographic Analysis: Understanding who the audience is, including their age, gender, location, interests, and lifestyle.</li>
                <li>Needs and Preferences: Assessing what the audience seeks in terms of content, style, tone, and format, which guides the creation of tailored content.</li>
            </ul>
        </li>
        <li><strong>SEO Keyword Integration:</strong>
            <ul>
                <li>Keyword Research: Utilizing tools and techniques to identify high-value search terms that the target audience uses when looking for content within the relevant domain.</li>
                <li>Keyword Optimization: Strategically incorporating these keywords into the content, including titles, meta descriptions, headers, and the body text, to enhance search engine visibility and ranking.</li>
                <li>Balance and Natural Placement: Ensuring that keywords are used effectively within the content without compromising its readability or quality (avoiding keyword stuffing).</li>
            </ul>
        </li>
    </ol>

    <div class="modal-subtitle">Purpose:</div>
    <p>The primary goal of evaluating Target Audience and SEO Keywords is to ensure that the content is both appealing and accessible to the people it is intended for, thus increasing engagement, satisfaction, and conversion rates. This dual approach helps in building a loyal audience base while also driving new traffic through organic search results.</p>
          </div>
        </div>
      </div>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="accordion-subheader">Target Audience</div>
        <div>${data.keywords["Target Audience"]}</div>
        <br />
        <div class="keyword-grade-container">
          <div class="suggested-keyword-container">
            <div class="accordion-subheader">Suggested Keywords for SEO</div>
            <div>1. ${data.keywords["SEO Keywords"][0]}</div>
            <div>2. ${data.keywords["SEO Keywords"][1]}</div>
            <div>3. ${data.keywords["SEO Keywords"][2]}</div>
            <div>4. ${data.keywords["SEO Keywords"][3]}</div>
            <div>5. ${data.keywords["SEO Keywords"][4]}</div>
            <div>6. ${data.keywords["SEO Keywords"][5]}</div>
            <div>7. ${data.keywords["SEO Keywords"][6]}</div>
            <div>8. ${data.keywords["SEO Keywords"][7]}</div>
            <div>9. ${data.keywords["SEO Keywords"][8]}</div>
            <div>10. ${data.keywords["SEO Keywords"][9]}</div>
          </div>
          <div class="keyword-usage-container">
            <div id="keyword-usage-chart"></div>
            <div class="keyword-usage-feedback">
              <span class="keyword-usage-title">Keyword Usage</span>
              <i class="fa-solid fa-circle-info info-icon info-keywordUsage"></i>
              <!-- Modal Structure -->
              <div id="keywordUsageModal" class="modal">
                <div class="modal-content">
                  <span class="close">&times;</span>
                  <div class="modal-title">Keyword Usage Rating</div>
                  <hr/>
                  <p><strong>Definition:</strong> The Keyword Usage Rating evaluates the strategic use of keywords within website content to improve search engine rankings without compromising the quality and readability of the text. This rating focuses on the balance between SEO optimization and natural language flow.</p>

    <div class="modal-subtitle">Components:</div>
    <ol>
        <li><strong>Relevance and Selection:</strong>
            <ul>
                <li>Keyword Research: Analyzing keyword relevance to ensure that the chosen keywords are highly relevant to the content's topics and the audience's search intentions.</li>
                <li>Competitive Analysis: Considering keyword competition and selecting terms that are attainable and likely to yield high returns in traffic.</li>
            </ul>
        </li>
        <li><strong>Placement and Density:</strong>
            <ul>
                <li>Strategic Placement: Assessing the placement of keywords within crucial areas such as titles, headings, meta descriptions, and initial paragraphs to maximize SEO impact.</li>
                <li>Keyword Density: Evaluating the frequency of keyword appearances to avoid over-optimization, which can lead to penalties from search engines. The focus is on a natural inclusion of keywords that aligns with the content’s flow.</li>
            </ul>
        </li>
        <li><strong>Context and Variations:</strong>
            <ul>
                <li>Semantic Variations: Incorporating synonyms and long-tail variations of the primary keywords to cover broader search queries and contexts.</li>
                <li>Contextual Fit: Ensuring that all keywords fit naturally within the content's context, contributing to a seamless reader experience.</li>
            </ul>
        </li>
        <li><strong>Content Quality:</strong>
            <ul>
                <li>Enhancement, Not Detraction: Confirming that keyword usage enhances the content rather than detracts from it. Keywords should support the content’s purpose and add value to the reader, not just serve SEO goals.</li>
            </ul>
        </li>
        <li><strong>Adaptability:</strong>
            <ul>
                <li>Monitoring and Updating: Regularly reviewing keyword performance and adapting content strategies based on changing search trends and keyword effectiveness.</li>
            </ul>
        </li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The Keyword Usage Rating would be calculated based on a blend of automated keyword analysis tools and manual review. Tools can provide data on keyword density and placement, while manual review ensures that keyword usage enhances readability and engagement.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This rating helps content creators balance SEO with user engagement, ensuring that the content not only ranks well in search engine results but also provides value and readability for the audience. Effective keyword usage fosters better user experiences and search engine visibility, leading to increased organic traffic and user retention.</p>
                </div>
              </div> 
              <div>${data.moreGrades["Keyword Usage Feedback"]}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- end of accordion body -->
  </div>
  <!-- end of accordion item -->
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>Readability</span>
        <i class="fa-solid fa-circle-info info-icon info-readability"></i>
        <!-- Modal Structure -->
        <div id="readabilityModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">Readability Rating</div>
            <hr/>
    <p><strong>Definition:</strong> The Readability Grade evaluates how accessible and understandable the content is to the intended audience. This measure considers various elements of text composition, such as language simplicity, sentence structure, and the overall organization of information.</p>

    <div class="modal-subtitle">Factors Influencing Readability:</div>
    <ol>
        <li><strong>Language and Tone:</strong> Analysis of the language's complexity, suitability for the target audience, and the tone's appropriateness for the content's purpose.</li>
        <li><strong>Structure and Organization:</strong> Examination of how well the content is organized, including the use of headings, subheadings, bullet points, and paragraphs to break up text and facilitate easier reading.</li>
        <li><strong>Paragraph Design:</strong> Evaluation of paragraph length and structure to ensure text blocks are not too dense, which could hinder readability.</li>
        <li><strong>Sentence Complexity:</strong> Review of sentence length and complexity, preferring shorter, more concise sentences that are easier to understand.</li>
        <li><strong>Typography:</strong> Consideration of font size, type, spacing, and color contrast to ensure text is easy on the eyes and accessible to people with visual impairments.</li>
        <li><strong>Use of Non-Text Elements:</strong> Inclusion of images, charts, and other visual aids to support text content and provide breaks in reading, aiding in better comprehension.</li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>Readability is typically assessed using recognized formulas such as the Flesch Reading Ease or the Gunning Fog Index, which provide a numerical value based on sentence length and word complexity. Additionally, manual evaluations are conducted to ensure practical comprehension levels are met.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This grade helps content creators understand how easily their audience can digest the information presented. Enhancing readability can lead to better engagement, lower bounce rates, and a generally more effective communication of ideas.</p>
          </div>
        </div>
      </div>
      <span class="header-chart" id="readability-chart"></span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="accordion-subheader">Feedback</div>
        <div>
          ${data.readability.Feedback}
        </div>
        <br />
        <div class="readability-charts-section">
          <div class="fres-container">
            <div>
            <span style="text-decoration: underline;">Flesch Reading Ease Score (FRES)</span>
            <i class="fa-solid fa-circle-info info-icon info-fres"></i>
            <!-- Modal Structure -->
              <div id="fresModal" class="modal">
                <div class="modal-content">
                  <span class="close">&times;</span>
                  <div class="modal-title">Flesch Reading Ease Score (FRES)</div>
                  <hr/>
                  <div class="modal-subtitle">Definition:</div>
    <p>The Flesch Reading Ease Score is a numerical scale that indicates how easy it is to understand a passage of English text. It was developed by Dr. Rudolf Flesch in the 1940s and is one of the oldest and most accurate readability formulas. The score is calculated based on the average sentence length and the average number of syllables per word.</p>

    <div class="modal-subtitle">How It Is Calculated:</div>
    <p>The formula for the Flesch Reading Ease Score is:</p>
    <p><code>Score = 206.835 - 1.015 × (average sentence length) - 84.6 × (average number of syllables per word)</code></p>
    <ul>
        <li><strong>Average sentence length:</strong> Total number of words divided by the total number of sentences.</li>
        <li><strong>Average number of syllables per word:</strong> Total number of syllables divided by the total number of words.</li>
    </ul>

    <div class="modal-subtitle">Why It Is Useful to You:</div>
    <p>The Flesch Reading Ease Score helps content creators evaluate and improve their writing for better accessibility and engagement. A higher score indicates that the text is easier to read and understand, making it suitable for a wider audience. This can be particularly important in environments where clarity and ease of comprehension are crucial, such as in educational content, business communications, and consumer-facing information.</p>

    <div class="modal-subtitle">Scoring Categories:</div>
    <table border="1">
        <thead>
            <tr>
                <th>Score Range</th>
                <th>Difficulty Level</th>
                <th>Suitable for</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>90-100</td>
                <td>Very Easy</td>
                <td>5th grade (10-11-year-olds)</td>
            </tr>
            <tr>
                <td>80-89</td>
                <td>Easy</td>
                <td>6th grade (11-12-year-olds)</td>
            </tr>
            <tr>
                <td>70-79</td>
                <td>Fairly Easy</td>
                <td>7th grade (12-13-year-olds)</td>
            </tr>
            <tr>
                <td>60-69</td>
                <td>Standard</td>
                <td>8th & 9th grade (13-15-year-olds)</td>
            </tr>
            <tr>
                <td>50-59</td>
                <td>Fairly Difficult</td>
                <td>High school students (15-18-year-olds)</td>
            </tr>
            <tr>
                <td>30-49</td>
                <td>Difficult</td>
                <td>College students</td>
            </tr>
            <tr>
                <td>0-29</td>
                <td>Very Difficult</td>
                <td>College graduates</td>
            </tr>
        </tbody>
    </table>
                </div>
              </div> 
            </div>
            <div style="width: 100%;">
              <button class="fres-button">
              <div class="progress" style="width: 0%;"></div>
              <span class="divider" style="left: 12.5%;"></span>
              <span class="divider" style="left: 25%;"></span>
              <span class="divider" style="left: 37.5%;"></span>
              <span class="divider" style="left: 50%;"></span>
              <span class="divider" style="left: 62.5%;"></span>
              <span class="divider" style="left: 75%;"></span>
              <span class="divider" style="left: 87.5%;"></span>
              </button>
            </div>
            <div>${data.readability["Flesch Reading Ease Score (FRES)"]} - ${data.readability.fresLevel}</div>
          </div>
          <div class="tov-container">
            <div>
            <span style="text-decoration: underline;">Tone of Voice</span>
            <i class="fa-solid fa-circle-info info-icon info-tov"></i>
            <!-- Modal Structure -->
              <div id="tovModal" class="modal">
                <div class="modal-content">
                  <span class="close">&times;</span>
                  <div class="modal-title">Tone of Voice</div>
                  <hr/>
                  <div class="modal-subtitle">Definition:</div>
    <p>Tone of voice in content refers to the overall attitude and style of communication that is conveyed through the choice of words, the structure of sentences, and the approach to the topic. It plays a crucial role in shaping how readers perceive the message and can significantly impact their emotional and cognitive engagement with the content.</p>

    <div class="modal-subtitle">Why Tone of Voice is Important:</div>
    <p>Tone of voice is essential because it sets the mood and influences the effectiveness of the communication. It helps to align the content with the audience’s expectations and preferences, enhancing readability and engagement. A well-chosen tone of voice makes the content more relatable and persuasive, fostering a stronger connection between the brand or author and the audience. Additionally, it aids in distinguishing a brand’s unique personality in a crowded market.</p>

    <div class="modal-subtitle">Ratings Categories:</div>
    <ul>
        <li><strong>Casual:</strong>
            <ul>
                <li><em>Definition:</em> A casual tone is informal, conversational, and friendly. It often uses colloquial language, contractions, and may include humor or slang.</li>
                <li><em>Suitability:</em> Best for brands targeting younger audiences or when trying to create a relaxed, approachable image. Often used in blogs, social media posts, and casual articles.</li>
            </ul>
        </li>
        <li><strong>Somewhat Casual:</strong>
            <ul>
                <li><em>Definition:</em> This tone is relaxed but avoids slang and colloquialisms. It's friendly and approachable without being overly informal.</li>
                <li><em>Suitability:</em> Suitable for brands that want to appear professional yet accessible, like in customer service content, informal business communications, and general audience websites.</li>
            </ul>
        </li>
        <li><strong>Neutral:</strong>
            <ul>
                <li><em>Definition:</em> A neutral tone is straightforward and professional without any emotional overtones. It focuses purely on delivering information.</li>
                <li><em>Suitability:</em> Ideal for factual reporting, business to business communications, and informational content where the objective is to inform rather than entertain or persuade.</li>
            </ul>
        </li>
        <li><strong>Somewhat Formal:</strong>
            <ul>
                <li><em>Definition:</em> This tone includes a degree of formality without being overly stiff. It is polite and reserved, using more complex sentence structures and vocabulary.</li>
                <li><em>Suitability:</em> Appropriate for professional audiences, academic writing, and formal communications where respect and professionalism are key.</li>
            </ul>
        </li>
        <li><strong>Formal:</strong>
            <ul>
                <li><em>Definition:</em> A formal tone is highly structured, using sophisticated vocabulary and complex sentence constructions. It avoids contractions and colloquial language.</li>
                <li><em>Suitability:</em> Best for legal documents, high-level academic works, official communications, and situations where precision and a display of expertise are necessary.</li>
            </ul>
        </li>
    </ul>
                </div>
              </div> 
            </div>
            <div style="width: 100%;">
              <button class="tov-button">
                <div class="progress" style="width: 0%;"></div>
                <span class="divider" style="left: 20%;"></span>
                <span class="divider" style="left: 40%;"></span>
                <span class="divider" style="left: 60%;"></span>
                <span class="divider" style="left: 80%;"></span>
              </button>
            </div>
            <div>${data.readability["Tone of Voice"]}</div>
          </div>
        </div>
        <br />
        <div class="accordion-subheader">Suggestions for Improvement</div>
        <div>
          1. ${data.readability["Suggestions for Improvement"][0]}
        </div>
        <div>
          2. ${data.readability["Suggestions for Improvement"][1]}
        </div>
        <div>
          3. ${data.readability["Suggestions for Improvement"][2]}
        </div>
        <div>
          4. ${data.readability["Suggestions for Improvement"][3]}
        </div>
        <div>
          5. ${data.readability["Suggestions for Improvement"][4]}
        </div>
      </div>
    </div>
    <!-- end of accordion body -->
  </div>
  <!-- end of accordion item -->
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>Topic Authority</span>
        <i class="fa-solid fa-circle-info info-icon info-topicAuthority"></i>
        <!-- Modal Structure -->
        <div id="topicAuthorityModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">Topic Authority Rating</div>
            <hr/>
    <p><strong>Definition:</strong> The Topic Authority Grade assesses the level of expertise, credibility, and thoroughness exhibited in the website's content regarding specific subjects. This grade helps gauge how trustworthy and authoritative the information presented is likely perceived by users and search engines alike.</p>

    <div class="modal-subtitle">Factors Influencing Topic Authority:</div>
    <ol>
        <li><strong>Expertise:</strong> Evaluation of the content creator's knowledge and background in the topic, including their qualifications and experience.</li>
        <li><strong>Credibility:</strong> Assessment of the sources cited within the content, the accuracy of the information provided, and the reputation of the content creator or website in the industry.</li>
        <li><strong>Thoroughness:</strong> Examination of how comprehensively the topic is covered, including the depth and breadth of the information provided.</li>
        <li><strong>Evidence and Research:</strong> Review of the empirical evidence supporting the content, including statistics, studies, and citations from reputable sources.</li>
        <li><strong>Update Frequency:</strong> Consideration of how regularly the content is updated to reflect the latest research, developments, and insights in the field.</li>
        <li><strong>User Engagement:</strong> Analysis of user interaction with the content, such as comments, shares, and references, which can indicate the community's trust and recognition of authority.</li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The Topic Authority Grade is typically derived from a combination of automated assessments and manual reviews. Automated tools may analyze the use of relevant keywords and the structure of links, while expert reviewers assess the qualitative aspects such as depth of analysis and source quality.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This grade aims to inform users about the reliability and authority of the content concerning the topics it addresses. High topic authority can contribute to better search engine rankings, higher trust from users, and increased citation by other authoritative sources.</p>
          </div>
        </div>
      </div>
      <span class="header-chart" id="topicAuthority-chart"></span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="accordion-subheader">Feedback</div>
        <div>
          ${data.topicAuthority.Feedback}
        </div>
        <br />
        <div class="accordion-subheader">Suggestions for Improvement</div>
        <div>
          1. ${data.topicAuthority["Suggestions for Improvement"][0]}
        </div>
        <div>
          2. ${data.topicAuthority["Suggestions for Improvement"][1]}
        </div>
        <div>
          3. ${data.topicAuthority["Suggestions for Improvement"][2]}
        </div>
        <div>
          4. ${data.topicAuthority["Suggestions for Improvement"][3]}
        </div>
        <div>
          5. ${data.topicAuthority["Suggestions for Improvement"][4]}
        </div>
      </div>
    </div>
    <!-- end of accordion body -->
  </div>
  <!-- end of accordion item -->
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>Content Value</span>
        <i class="fa-solid fa-circle-info info-icon info-contentValue"></i>
        <!-- Modal Structure -->
        <div id="contentValueModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">Content Value Rating</div>
            <hr/>
    <p><strong>Definition:</strong> The Content Value Grade evaluates the utility, relevance, and impact of the website’s content on its intended audience. This grade reflects how much value the content adds to the user's experience, whether by providing solutions, enhancing knowledge, or offering entertainment.</p>

    <div class="modal-subtitle">Factors Influencing Content Value:</div>
    <ol>
        <li><strong>Utility:</strong> Examination of how the content meets the practical needs of the audience, such as solving specific problems, answering questions, or providing actionable advice.</li>
        <li><strong>Relevance:</strong> Assessment of how the content aligns with the interests and current needs of the target audience.</li>
        <li><strong>Informativeness:</strong> Evaluation of the content's ability to enhance the audience’s understanding of a topic through detailed explanations, data-backed insights, and comprehensive coverage of the subject.</li>
        <li><strong>Uniqueness:</strong> Analysis of how the content stands out from other similar content in terms of perspective, depth of insight, or presentation.</li>
        <li><strong>Engagement:</strong> Review of the content’s ability to captivate the audience, encouraging them to interact with the content through comments, shares, or extended reading/viewing sessions.</li>
        <li><strong>Call to Action:</strong> Consideration of how effectively the content motivates users to engage further with the website, such as subscribing, purchasing, or participating in discussions.</li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The Content Value Grade is typically calculated based on qualitative assessments combined with user engagement metrics. Feedback from the audience, such as comments and sharing rates, is particularly important in determining this grade.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This grade is intended to guide content creators in optimizing their content to be more beneficial and appealing to their target audience. High content value usually correlates with higher user satisfaction, increased loyalty, and greater organic reach.</p>
          </div>
        </div>
      </div>
      <span class="header-chart" id="contentValue-chart"></span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="accordion-subheader">Feedback</div>
        <div>
          ${data.value.Feedback}
        </div>
        <br />
        <div class="accordion-subheader">Suggestions for Improvement</div>
        <div>
          1. ${data.value["Suggestions for Improvement"][0]}
        </div>
        <div>
          2. ${data.value["Suggestions for Improvement"][1]}
        </div>
        <div>
          3. ${data.value["Suggestions for Improvement"][2]}
        </div>
        <div>
          4. ${data.value["Suggestions for Improvement"][3]}
        </div>
        <div>
          5. ${data.value["Suggestions for Improvement"][4]}
        </div>
      </div>
    </div>
    <!-- end of accordion body -->
  </div>
  <!-- end of accordion item -->
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <div class="header-title">
        <span>SEO</span>
        <i class="fa-solid fa-circle-info info-icon info-seo"></i>
        <!-- Modal Structure -->
        <div id="seoModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-title">SEO Rating</div>
            <hr/>
    <p><strong>Definition:</strong> The SEO Grade evaluates how effectively the content is optimized to rank well in search engine results pages (SERPs). This rating considers various technical and content-related elements that influence a website’s search engine rankings.</p>

    <div class="modal-subtitle">Factors Influencing SEO:</div>
    <ol>
        <li><strong>Keyword Optimization:</strong> Analysis of how well the content utilizes keywords that are relevant to the target audience’s search queries.</li>
        <li><strong>Content Quality:</strong> Evaluation of the originality, relevance, and utility of the content, which can affect search rankings and user engagement.</li>
        <li><strong>Mobile Friendliness:</strong> Assessment of the website’s usability on mobile devices, considering the increasing prevalence of mobile browsing.</li>
        <li><strong>Page Load Speed:</strong> Review of the time it takes for the website to load, with faster speeds generally providing a better user experience and benefiting SEO.</li>
        <li><strong>Backlink Profile:</strong> Examination of the quantity and quality of external sites that link back to the website, which can significantly influence its authority and ranking.</li>
        <li><strong>URL Structure:</strong> Evaluation of the URL format for ease of understanding and relevance to the content.</li>
        <li><strong>Meta Tags:</strong> Review of the use of meta titles and descriptions, which help search engines and users understand the content’s topic and relevance.</li>
        <li><strong>Image Optimization:</strong> Consideration of the use of alt text, file size, and file name in images, which can impact page load speed and accessibility, thus affecting SEO.</li>
    </ol>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The SEO Grade is typically derived from a combination of automated tools that scan and analyze the website’s SEO elements and manual reviews by SEO experts to assess the strategic implementation of SEO practices.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This grade aims to provide insights into how well the website is positioned to be discovered via search engines. Effective SEO leads to greater visibility, higher traffic, and potentially increased conversions and revenue.</p>
          </div>
        </div>
      </div>
      <span class="header-chart" id="seo-chart"></span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div class="seo-feed-meta">
          <div class="seo-feedback">
            <div class="accordion-subheader">Feedback</div>
            <div>
              ${data.seo.Feedback}
            </div>
          </div>
          <div class="seo-meta-container">
            <div id="meta-chart"></div>
            <div class="meta-feedback">
              <span class="meta-title">Meta Tags</span>
              <i class="fa-solid fa-circle-info info-icon info-meta"></i>
              <!-- Modal Structure -->
              <div id="metaModal" class="modal">
                <div class="modal-content">
                  <span class="close">&times;</span>
                  <div class="modal-title">Meta Tag Rating</div>
                  <hr/>
                  <div class="modal-subtitle">Definition:</div>
    <p>The Meta Tags Rating evaluates the implementation and effectiveness of meta tags in a website’s HTML to communicate page content to search engines and users. Meta tags are snippets of text that describe a page's content; they don't appear on the page itself but only in the page's code. Proper use of meta tags can help improve a page's SEO and user click-through rates from search engine results pages (SERPs).</p>

    <div class="modal-subtitle">Components:</div>
    <ul>
        <li><strong>Title Tag:</strong>
            <ul>
                <li>Relevance and Clarity: Evaluates whether the title tag accurately reflects the content of the page and contains the main keywords.</li>
                <li>Length: Ensures the title is of optimal length, typically between 50-60 characters, to ensure it displays well in search results.</li>
            </ul>
        </li>
        <li><strong>Meta Description:</strong>
            <ul>
                <li>Descriptiveness and Engagement: Assesses whether the meta description provides a clear and engaging summary of the page content, encouraging clicks from SERPs.</li>
                <li>Keyword Integration: Examines if relevant keywords are naturally integrated into the description.</li>
                <li>Length: Checks if the description is within the recommended length of 150-160 characters to ensure complete visibility in SERPs.</li>
            </ul>
        </li>
        <li><strong>Meta Keywords:</strong>
            <ul>
                <li>Relevance: Reviews the relevance of meta keywords to the content of the page.</li>
                <li>Current Usage Practices: Considers the diminished importance of meta keywords in modern SEO practices, focusing more on other tags.</li>
            </ul>
        </li>
        <li><strong>Robots Meta Tag:</strong>
            <ul>
                <li>Directives Accuracy: Evaluates whether the robots meta tag correctly directs search engines on what to follow and index.</li>
            </ul>
        </li>
        <li><strong>Social Media Meta Tags (Open Graph, Twitter Cards):</strong>
            <ul>
                <li>Presence and Configuration: Assesses the implementation of social media meta tags that define how titles, descriptions, and images are displayed when pages are shared on social platforms.</li>
            </ul>
        </li>
    </ul>

    <div class="modal-subtitle">Scoring Method:</div>
    <p>The Meta Tags Rating is calculated based on a checklist approach where each component is reviewed and scored based on its adherence to best practices. Points are awarded for correct usage, relevance, and effectiveness in contributing to SEO and user engagement.</p>

    <div class="modal-subtitle">Purpose:</div>
    <p>This rating aims to provide website owners and content creators with actionable insights into how well their meta tags are optimized for both search engines and social media platforms. Effective meta tags enhance discoverability and attractiveness of the content in search results and when shared on social media, leading to better engagement and increased traffic.</p>
                </div>
              </div>  
              <div>${data.moreGrades["Meta Tags Feedback"]}</div>
            </div>
          </div>
        </div>
        <br />
        <div class="accordion-subheader">Suggestions for Improvement</div>
        <div>
          1. ${data.seo["Suggestions for Improvement"][0]}
        </div>
        <div>
          2. ${data.seo["Suggestions for Improvement"][1]}
        </div>
        <div>
          3. ${data.seo["Suggestions for Improvement"][2]}
        </div>
        <div>
          4. ${data.seo["Suggestions for Improvement"][3]}
        </div>
        <div>
          5. ${data.seo["Suggestions for Improvement"][4]}
        </div>
      </div>
    </div>
    <!-- end of accordion body -->
  </div>
  <!-- end of accordion item -->
  <div class="accordion__item js-accordion-item">
    <div class="accordion-header js-accordion-header">
      <span class="header-title">What's Next?</span>
    </div>
    <div class="accordion-body js-accordion-body">
      <div class="accordion-body__contents">
        <div>
          Thank you for reviewing your AI Content Report. We hope it has
          provided you with valuable insights and a glimpse into the potential
          improvements for your content strategy. However, this is just the
          beginning. To dive deeper and truly transform your content into a
          powerful engagement tool, we invite you to take the next step with us.

          <p>Schedule Your FREE Content Assessment Today!</p>

          <p>
            Our comprehensive Free Content Assessment is designed to give you a
            detailed roadmap tailored specifically to your needs. Here’s what
            you can expect when you book a meeting with our team of experts:
          </p>

          <ul>
            <li>
              Expert Content Evaluation: We’ll analyze your existing content
              with a fine-tooth comb, identifying strengths and areas for
              improvement, ensuring that every piece aligns perfectly with your
              brand voice and objectives.
            </li>
            <li>
              High-Level SEO Audit: Understanding the SEO landscape is crucial.
              Our audit will assess your current SEO performance and uncover
              opportunities to enhance your visibility and ranking on search
              engines.
            </li>
            <li>
              Competitive Review: Stay one step ahead! We’ll provide a thorough
              analysis of your competitors, helping you understand their
              strategies and how you can outperform them.
            </li>
            <li>
              Topline Best Practices for SEO Performance and Engagement: Gain
              access to industry-leading practices that boost SEO and user
              engagement, ensuring your content not only reaches but also
              resonates with your target audience.
            </li>
            <li>
              Recommended Content for Themes, Titles, and Formats: We will offer
              personalized recommendations for themes, titles, and content
              formats that are most likely to engage your audience and achieve
              your strategic goals.
            </li>
          </ul>

          <p>
            Don’t miss out on the opportunity to elevate your content strategy
            to new heights. Contact us today to book your full Free Content
            Assessment and start making every word count!
          </p>

          <button class="content-assessment-button">
            <a>Book A Free Content Assessment</a>
          </button>
        </div>
      </div>
      <!-- end of accordion body -->
    </div>
    <!-- end of accordion item -->
  </div>
  <!-- end of accordion -->
`;

  contentElement.appendChild(accordionItem);

  accordion.init({ speed: 300, oneOpen: true });
  $(document).on("click", ".js-accordion-header", function () {
    accordion.toggle($(this));
  });

  // Render Circle Grade Charts
  renderGradeChart(
    "overall-chart",
    parseFloat(data.overallGrade.Rating),
    parseFloat(data.overallGrade["Potential Rating"])
  );
  renderGradeChart(
    "readability-chart",
    parseFloat(data.readability.Rating),
    parseFloat(data.readability["Potential Rating"])
  );
  renderGradeChart(
    "topicAuthority-chart",
    parseFloat(data.topicAuthority.Rating),
    parseFloat(data.topicAuthority["Potential Rating"])
  );
  renderGradeChart(
    "contentValue-chart",
    parseFloat(data.value.Rating),
    parseFloat(data.value["Potential Rating"])
  );
  renderGradeChart(
    "seo-chart",
    parseFloat(data.seo.Rating),
    parseFloat(data.seo["Potential Rating"])
  );
  renderGradeChart(
    "keyword-usage-chart",
    parseFloat(data.moreGrades["Keyword Usage Rating"])
  );
  renderGradeChart(
    "meta-chart",
    parseFloat(data.moreGrades["Meta Tags Rating"])
  );

  // Render Overall Area Chart
  renderAreaChart(data);

  updateFRESChart(
    parseFloat(data.readability["Flesch Reading Ease Score (FRES)"])
  ); // Call this function with the actual data value

  var tovRating = 0;
  if (data.readability["Tone of Voice"] === "Casual") {
    tovRating = 20;
  } else if (data.readability["Tone of Voice"] === "Somewhat Casual") {
    tovRating = 40;
  } else if (data.readability["Tone of Voice"] === "Neutral") {
    tovRating = 60;
  } else if (data.readability["Tone of Voice"] === "Somewhat Formal") {
    tovRating = 80;
  } else if (data.readability["Tone of Voice"] === "Formal") {
    tovRating = 100;
  }

  updateTOVChart(tovRating); // Call this function with the actual data value

  // Setup modals
  setupModal(".info-overall", "ovrModal");
  setupModal(".info-targetAudience", "targetAudienceModal");
  setupModal(".info-readability", "readabilityModal");
  setupModal(".info-topicAuthority", "topicAuthorityModal");
  setupModal(".info-contentValue", "contentValueModal");
  setupModal(".info-seo", "seoModal");
  setupModal(".info-meta", "metaModal");
  setupModal(".info-keywordUsage", "keywordUsageModal");
  setupModal(".info-fres", "fresModal");
  setupModal(".info-tov", "tovModal");
}

// AI Report Accordion
var accordion = (function () {
  var $accordion = $(".js-accordion");
  var $accordion_header = $accordion.find(".js-accordion-header");
  var $accordion_item = $(".js-accordion-item");

  // default settings
  var settings = {
    // animation speed
    speed: 400,

    // close all other accordion items if true
    oneOpen: false,
  };

  return {
    // pass configurable object literal
    init: function ($settings) {
      $accordion_header.on("click", function () {
        accordion.toggle($(this));
      });

      $.extend(settings, $settings);

      // ensure only one accordion is active if oneOpen is true
      if (settings.oneOpen && $(".js-accordion-item.ai-active").length > 1) {
        $(".js-accordion-item.ai-active:not(:first)").removeClass("ai-active");
      }

      // reveal the active accordion bodies
      $(".js-accordion-item.ai-active").find("> .js-accordion-body").show();
    },
    toggle: function ($this) {
      if (
        settings.oneOpen &&
        $this[0] !=
          $this
            .closest(".js-accordion")
            .find("> .js-accordion-item.ai-active > .js-accordion-header")[0]
      ) {
        $this
          .closest(".js-accordion")
          .find("> .js-accordion-item")
          .removeClass("ai-active")
          .find(".js-accordion-body")
          .slideUp();
      }

      // show/hide the clicked accordion item
      $this.closest(".js-accordion-item").toggleClass("ai-active");
      $this.next().stop().slideToggle(settings.speed);
    },
  };
})();

//$(document).ready(function(){
//accordion.init({ speed: 300, oneOpen: true });
//});

function renderGradeChart(chartID, grade, potential) {
  Highcharts.chart(chartID, {
    chart: {
      type: "solidgauge",
      backgroundColor: "transparent",
      reflow: true,
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    },
    title: null,
    pane: {
      center: ["50%", "50%"],
      size: "100%",
      startAngle: 0,
      endAngle: 360,
      background: {
        backgroundColor: "#454a58",
        innerRadius: "75%",
        outerRadius: "100%",
        shape: "arc",
        borderColor: "black",
      },
    },
    tooltip: {
      enabled: false,
    },
    yAxis: {
      min: 0,
      max: 10,
      //stops: [
      //[0.1, '#e74c3c'], // red
      //[0.5, '#f1c40f'], // yellow
      //[0.9, '#2ecc71'] // green
      //],
      minorTickInterval: null,
      tickPixelInterval: 400,
      tickWidth: 0,
      gridLineWidth: 0,
      gridLineColor: "black",
      labels: {
        enabled: false,
      },
      title: {
        enabled: false,
      },
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      solidgauge: {
        innerRadius: "75%",
        dataLabels: {
          verticalAlign: "center",
          y: -40,
          borderWidth: 0,
          useHTML: true,
          style: {
            color: "white",
            fontSize: "10px",
            fontWeight: "lighter", // Change the font weight to lighter
            // You can add more font properties if needed
          },
        },
      },
    },
    series: [
      {
        data: [{ y: potential, color: "#4fb8ab" }],
        dataLabels: {
          enabled: false,
        },
      },
      {
        data: [{ y: grade, color: "rgb(238,85,53)" }],
        dataLabels: {
          format: '<p style="text-align:center; font-size: 22px;">{y}</p>',
          //y: 0
        },
      },
    ],
  });
}

function renderAreaChart(data) {
  Highcharts.chart("area-chart", {
    chart: {
      polar: true,
      type: "area",
      backgroundColor: null,
      reflow: true,
      marginTop: 22,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      style: {
        fontFamily: "Open Sans Condensed, sans-serif",
        fontSize: "16px",
      },
    },

    title: {
      text: null,
      x: 0,
    },

    credits: { enabled: false },

    exporting: {
      enabled: false,
    },

    pane: {
      size: "100%",
    },

    xAxis: {
      categories: [
        "Overall",
        "Content Value",
        "Readability",
        "Topic Authority",
        "SEO",
      ],
      tickmarkPlacement: "on",
      lineWidth: 0,
      gridLineColor: "grey",
      labels: {
        style: {
          color: "grey",
        },
      },
    },

    yAxis: {
      gridLineInterpolation: "polygon",
      lineWidth: 0,
      gridLineColor: "#C0C0C0",
      min: 1,
      max: 10,
      tickInterval: 2,
      labels: {
        enabled: false,
      },
      gridLineColor: "grey",
    },

    tooltip: {
      shared: false,
      pointFormat:
        '<span style="color:"white">{series.name}: <b>{point.y:,.0f}</b><br/>',
    },

    legend: {
      align: "right",
      verticalAlign: "top",
      y: 70,
      layout: "vertical",
      enabled: false,
    },

    series: [
      {
        name: "Potential",
        data: [
          parseFloat(data.overallGrade["Potential Rating"]),
          parseFloat(data.value["Potential Rating"]),
          parseFloat(data.readability["Potential Rating"]),
          parseFloat(data.topicAuthority["Potential Rating"]),
          parseFloat(data.seo["Potential Rating"]),
        ],
        pointPlacement: "on",
        color: "#4fb8ab", // Outline color
        type: "area", // This will create just the outline without fill
        lineWidth: 2.0, // Setting line width for better visibility
        fillOpacity: 0.3, // Ensures there is no fill
      },
      {
        name: "Rating",
        data: [
          parseFloat(data.overallGrade.rating),
          parseFloat(data.value.rating),
          parseFloat(data.readability.rating),
          parseFloat(data.topicAuthority.rating),
          parseFloat(data.seo.rating),
        ],
        pointPlacement: "on",
        color: "#ef6336",
      },
    ],
  });
}
