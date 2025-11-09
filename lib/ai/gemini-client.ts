import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192, // Increased to handle complete invoice data
  }
});

export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    
    // Check for blocked content or safety filters
    if (response.promptFeedback?.blockReason) {
      const reason = response.promptFeedback.blockReason;
      console.error('❌ Content blocked by Gemini:', reason);
      throw new Error(`Content was blocked by Gemini safety filters. Reason: ${reason}. Please try with different text.`);
    }
    
    // Check if candidates exist and are not blocked
    if (!response.candidates || response.candidates.length === 0) {
      console.error('❌ No candidates in response');
      console.error('Response object:', {
        promptFeedback: response.promptFeedback,
      });
      throw new Error('Gemini API returned no candidates. The content may have been blocked or the API key may be invalid.');
    }
    
    // Check if candidate is blocked
    const candidate = response.candidates[0];
    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
      console.error('❌ Candidate blocked:', candidate.finishReason);
      throw new Error(`Content was blocked by Gemini. Reason: ${candidate.finishReason}. Please try with different text.`);
    }
    
    // Check if response was truncated due to max tokens
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response truncated due to MAX_TOKENS limit');
    }
    
    const text = response.text();
    
    // Check if response is empty or null
    if (!text || text.trim().length === 0) {
      console.error('❌ Gemini API returned empty response');
      console.error('Response object:', {
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
        finishReason: candidate?.finishReason,
      });
      throw new Error('Gemini API returned an empty response. The content may have been blocked or the API key may be invalid.');
    }
    
    return text;
  } catch (error) {
    const err = error as Error;
    console.error('Gemini API Error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    
    // Provide more helpful error messages
    if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    } else if (err.message.includes('SAFETY') || err.message.includes('blocked')) {
      throw new Error('Content was blocked by Gemini safety filters. Please try with different text.');
    } else if (err.message.includes('quota') || err.message.includes('rate limit')) {
      throw new Error('Gemini API quota exceeded or rate limited. Please try again later.');
    }
    
    throw new Error(`AI generation failed: ${err.message}`);
  }
}

export function cleanJSONResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/gi, '');
  cleaned = cleaned.replace(/```javascript\n?/gi, '');
  cleaned = cleaned.replace(/```\n?/gi, '');
  cleaned = cleaned.replace(/``````\s*/g, '');
  
  // Find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}
