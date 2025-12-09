
import { ExtractedContent, AIAnalysis, ContentSection, AnalysisData } from '../types';

function buildAnalysisPrompt(extractedData: ExtractedContent): string {
  return `You are an expert SEO analyst. Analyze the following website data and provide a comprehensive SEO score based on the predefined criteria.

## EXTRACTED PAGE DATA:
- URL: ${extractedData.url}
- Domain: ${extractedData.domain}
- HTTPS: ${extractedData.isHttps}
- URL Length: ${extractedData.urlLength} characters

### Title Tag:
"${extractedData.title}"
Length: ${extractedData.title.length} characters

### Meta Description:
"${extractedData.metaDescription}"
Length: ${extractedData.metaDescription.length} characters

### Headings:
- H1 tags (${extractedData.headings.h1.length}): ${extractedData.headings.h1.join(' | ') || 'None'}
- H2 tags (${extractedData.headings.h2.length}): ${extractedData.headings.h2.slice(0, 5).join(' | ') || 'None'}
- H3 tags (${extractedData.headings.h3.length}): ${extractedData.headings.h3.slice(0, 3).join(' | ') || 'None'}

### Content:
- Word Count: ${extractedData.wordCount}
- First 100 Words: "${extractedData.first100Words}"
- Paragraphs: ${extractedData.paragraphs.length}

### Images:
- Total: ${extractedData.images.length}
- With Alt Text: ${extractedData.images.filter(i => i.hasAlt).length}

### Links:
- Internal Links: ${extractedData.internalLinks.length}
- External Links: ${extractedData.externalLinks.length}

### Technical Elements:
- Canonical: ${extractedData.canonical || 'Not set'}
- Viewport: ${extractedData.viewport || 'Not set'}
- Robots Meta: ${extractedData.robots || 'Not set'}
- Language: ${extractedData.lang || 'Not declared'}
- Open Graph Title: ${extractedData.ogTitle ? 'Yes' : 'No'}
- Twitter Card: ${extractedData.twitterCard ? 'Yes' : 'No'}
- Schema Types: ${extractedData.schemas.join(', ') || 'None detected'}

## SCORING CRITERIA:

### On-Page SEO (25 points max)
### Keywords & Content (25 points max)  
### Technical SEO (30 points max)
### UX & Mobile (20 points max)

## RESPONSE FORMAT (JSON only):
{
    "overallScore": <number 0-100>,
    "confidence": <number 0-100>,
    "scores": {
        "onPage": { "score": <0-25>, "passed": [<criterion ids>], "failed": [<criterion ids>] },
        "keywords": { "score": <0-25>, "passed": [<criterion ids>], "failed": [<criterion ids>] },
        "technical": { "score": <0-30>, "passed": [<criterion ids>], "failed": [<criterion ids>] },
        "uxMobile": { "score": <0-20>, "passed": [<criterion ids>], "failed": [<criterion ids>] }
    },
    "primaryKeywords": [{"word": "<keyword>", "count": <number>, "density": "<percent>"}],
    "suggestedKeywords": ["<keyword1>", "<keyword2>", ...],
    "contentQuality": {
        "readabilityScore": <0-100>,
        "uniquenessScore": <0-100>,
        "depthScore": <0-100>
    },
    "technicalEstimates": {
        "fcp": "<seconds>",
        "lcp": "<seconds>",
        "cls": "<score>",
        "tti": "<seconds>"
    },
    "summary": "<2-3 sentence executive summary>",
    "keywordAnalysis": "<detailed paragraph about keyword usage and opportunities>",
    "recommendations": [
        {
            "priority": "critical|warning|opportunity",
            "title": "<short title>",
            "description": "<what's the issue>",
            "suggestion": "<how to fix it>",
            "impact": "<expected improvement>"
        }
    ],
    "optimizedTitle": "<improved title tag, 50-60 chars>",
    "optimizedMetaDescription": "<improved meta description, 150-160 chars>",
    "contentImprovements": ["<improvement1>", "<improvement2>", ...],
    "industryComparison": "<how this page compares to industry standards>",
    "sectionReplacements": [
        {
            "sectionType": "h1|h2|h3|paragraph",
            "original": "<original text>",
            "optimized": "<SEO-optimized replacement>",
            "reasoning": "<why this change improves SEO>"
        }
    ]
}

Provide ONLY the JSON response, no additional text.`;
}

export async function analyzeWithAI(
  extractedData: ExtractedContent,
  apiKey: string,
  model: string
): Promise<AIAnalysis> {
  const prompt = buildAnalysisPrompt(extractedData);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'SEO Analyzer Pro'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function generateContentReplacements(
  section: ContentSection,
  instructions: string,
  analysisData: AnalysisData,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = `You are an expert SEO content writer. Generate an optimized replacement for the following content section.

## CONTEXT:
- Website: ${analysisData.domain}
- Page Title: ${analysisData.title}
- Primary Keywords: ${analysisData.aiAnalysis.primaryKeywords.map(k => k.word).join(', ')}
- Suggested Keywords: ${analysisData.aiAnalysis.suggestedKeywords.join(', ')}

## SECTION TO OPTIMIZE:
Type: ${section.type}
Label: ${section.label}
Original Content: "${section.content}"

## INSTRUCTIONS:
${instructions || 'Optimize for SEO while maintaining the same meaning and structure. Include relevant keywords naturally.'}

## REQUIREMENTS:
1. Maintain the same general structure and format as the original
2. Naturally incorporate primary and related keywords
3. Improve readability and engagement
4. Keep similar length (for titles: 50-60 chars, for meta descriptions: 150-160 chars)
5. Make it compelling and click-worthy

Respond with ONLY the optimized text, no explanations or formatting.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'SEO Analyzer Pro'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO content writer. Provide only the optimized content, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function fetchKeywordSuggestions(
  keyword: string,
  login: string,
  password: string
): Promise<string[]> {
  // DataForSEO Keywords Data API endpoint for keyword suggestions
  const credentials = btoa(`${login}:${password}`);
  
  try {
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keywords: [keyword],
        language_code: 'en',
        location_code: 2840 // United States
      }])
    });

    if (!response.ok) {
      throw new Error('DataForSEO API error');
    }

    const data = await response.json();
    const keywords: string[] = [];
    
    if (data.tasks?.[0]?.result?.[0]?.keyword_data) {
      data.tasks[0].result[0].keyword_data.forEach((item: any) => {
        if (item.keyword) {
          keywords.push(item.keyword);
        }
      });
    }
    
    return keywords.slice(0, 20);
  } catch (error) {
    console.error('DataForSEO error:', error);
    return [];
  }
}

export async function fetchRelatedKeywords(
  keyword: string,
  login: string,
  password: string
): Promise<{ keyword: string; searchVolume: number; competition: string }[]> {
  const credentials = btoa(`${login}:${password}`);
  
  try {
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keywords: [keyword],
        language_code: 'en',
        location_code: 2840
      }])
    });

    if (!response.ok) {
      throw new Error('DataForSEO API error');
    }

    const data = await response.json();
    const results: { keyword: string; searchVolume: number; competition: string }[] = [];
    
    if (data.tasks?.[0]?.result) {
      data.tasks[0].result.forEach((item: any) => {
        results.push({
          keyword: item.keyword,
          searchVolume: item.search_volume || 0,
          competition: item.competition || 'unknown'
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('DataForSEO error:', error);
    return [];
  }
}
