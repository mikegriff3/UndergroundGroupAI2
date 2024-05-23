export function createMailOptions(email, data) {
  const sub = data?.subdomain || "N/A";
  const urlAnalyzed = data?.originalUrl || "N/A";

  return {
    from: "mike@theundergroundgroup.com",
    to: "mike@theundergroundgroup.com",
    subject: "New Email Submission - AI Content Analysis Report",
    text: `
    New email submitted: ${email}
    Subdomain: ${sub}
    Url Analyzed: ${urlAnalyzed}

    Overall Grade: ${data.overallGrade.Rating}
    Overall Feedback: ${data.overallGrade.Feedback}
    Suggestions for Improvement:
    1. ${data.overallGrade["Suggestions for Improvement"][0]}
    2. ${data.overallGrade["Suggestions for Improvement"][1]}
    3. ${data.overallGrade["Suggestions for Improvement"][2]}
    4. ${data.overallGrade["Suggestions for Improvement"][3]}
    5. ${data.overallGrade["Suggestions for Improvement"][4]}

    Target Audience: ${data.keywords["Target Audience"]}
    Keyword Usage Grade: ${data.moreGrades["Keyword Usage Rating"]}
    Keyword Usage Feedback: ${data.moreGrades["Keyword Usage Feedback"]}
    Suggested Keywords for SEO:
    1. ${data.keywords["SEO Keywords"][0]}
    2. ${data.keywords["SEO Keywords"][1]}
    3. ${data.keywords["SEO Keywords"][2]}
    4. ${data.keywords["SEO Keywords"][3]}
    5. ${data.keywords["SEO Keywords"][4]}
    6. ${data.keywords["SEO Keywords"][5]}
    7. ${data.keywords["SEO Keywords"][6]}
    8. ${data.keywords["SEO Keywords"][7]} 
    9. ${data.keywords["SEO Keywords"][8]}
    10. ${data.keywords["SEO Keywords"][9]}

    Readability Grade: ${data.readability.Rating}
    Readability Feedback: ${data.readability.Feedback}
    Flesch Score: ${data.readability["Flesch Reading Ease Score (FRES)"]}
    Tone of Voice: ${data.readability["Tone of Voice"]}
    Suggestions for Improvement:
    1. ${data.readability["Suggestions for Improvement"][0]}
    2. ${data.readability["Suggestions for Improvement"][1]}
    3. ${data.readability["Suggestions for Improvement"][2]}
    4. ${data.readability["Suggestions for Improvement"][3]}
    5. ${data.readability["Suggestions for Improvement"][4]}

    Topic Authority Grade: ${data.topicAuthority.Rating}
    Topic Authority Feedback: ${data.topicAuthority.Feedback}
    Suggestions for Improvement:
    1. ${data.topicAuthority["Suggestions for Improvement"][0]}
    2. ${data.topicAuthority["Suggestions for Improvement"][1]}
    3. ${data.topicAuthority["Suggestions for Improvement"][2]}
    4. ${data.topicAuthority["Suggestions for Improvement"][3]}
    5. ${data.topicAuthority["Suggestions for Improvement"][4]}

    Content Value Grade: ${data.value.Rating}
    Content Value Feedback: ${data.value.Feedback}
    Suggestions for Improvement:
    1. ${data.value["Suggestions for Improvement"][0]}
    2. ${data.value["Suggestions for Improvement"][1]}
    3. ${data.value["Suggestions for Improvement"][2]}
    4. ${data.value["Suggestions for Improvement"][3]}
    5. ${data.value["Suggestions for Improvement"][4]}

    SEO Grade: ${data.seo.Rating}
    SEO Feedback: ${data.seo.Feedback}
    Meta Tag Grade: ${data.moreGrades["Meta Tags Rating"]}
    Meta Tag Feedback: ${data.moreGrades["Meta Tags Feedback"]}
    Suggestions for Improvement:
    1. ${data.seo["Suggestions for Improvement"][0]}
    2. ${data.seo["Suggestions for Improvement"][1]}
    3. ${data.seo["Suggestions for Improvement"][2]}
    4. ${data.seo["Suggestions for Improvement"][3]}
    5. ${data.seo["Suggestions for Improvement"][4]}
    `,
  };
}
