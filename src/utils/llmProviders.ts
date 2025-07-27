import { LLMProvider, ConversionSettings, ConversionExample } from '../types';

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'local',
    name: 'Local/Custom API',
    baseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    models: ['custom']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']
  }
];

export class LLMService {
  static async convertToMarkdown(
    text: string,
    settings: ConversionSettings,
    examples: ConversionExample[] = []
  ): Promise<any> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text content provided for conversion',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(text, examples, settings.customPrompt);
      const provider = LLM_PROVIDERS.find(p => p.id === settings.provider);
      
      if (!provider) {
        throw new Error(`Invalid LLM provider: ${settings.provider}`);
      }

      let response;
      
      if (settings.provider === 'openai') {
        response = await this.callOpenAI(prompt, settings, provider);
      } else if (settings.provider === 'anthropic') {
        response = await this.callAnthropic(prompt, settings, provider);
      } else if (settings.provider === 'groq') {
        response = await this.callGroq(prompt, settings, provider);
      } else {
        response = await this.callCustomAPI(prompt, settings, provider);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        markdown: response.content,
        tokensUsed: response.tokensUsed,
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime
      };
    }
  }

  // New method for processing text (used for PDF cleaning)
  static async processText(
    prompt: string,
    settings: ConversionSettings
  ): Promise<any> {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'No prompt provided for text processing',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    
    try {
      const provider = LLM_PROVIDERS.find(p => p.id === settings.provider);
      
      if (!provider) {
        throw new Error(`Invalid LLM provider: ${settings.provider}`);
      }

      let response;
      
      if (settings.provider === 'openai') {
        response = await this.callOpenAI(prompt, settings, provider);
      } else if (settings.provider === 'anthropic') {
        response = await this.callAnthropic(prompt, settings, provider);
      } else if (settings.provider === 'groq') {
        response = await this.callGroq(prompt, settings, provider);
      } else {
        response = await this.callCustomAPI(prompt, settings, provider);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        content: response.content,
        tokensUsed: response.tokensUsed,
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime
      };
    }
  }

  private static buildPrompt(text: string, examples: ConversionExample[], customPrompt?: string): string {
    if (customPrompt && customPrompt.trim()) {
      return `${customPrompt.trim()}\n\nNow convert this legal pleading:\n\n${text}\n\nProvide only the clean markdown conversion:`;
    }

    let prompt = `You are an expert legal document processor specializing in Singapore civil litigation. Convert the following legal pleading to clean, well-structured markdown format.

CRITICAL REQUIREMENTS:
1. Preserve the document's legal structure and hierarchy
2. Convert numbered paragraphs to proper markdown format
3. Format case citations appropriately with proper emphasis
4. Maintain legal formatting conventions (e.g., party names, case references)
5. Ensure headers and sections are properly structured using markdown headers (# ## ###)
6. Convert tables and lists to markdown format
7. Preserve important legal numbering and cross-references
8. Focus on the substantive legal content only

FORMATTING GUIDELINES:
- Use # for main document title
- Use ## for major sections (e.g., "STATEMENT OF CLAIM", "PRAYER FOR RELIEF")
- Use ### for subsections
- Use numbered lists for legal paragraphs (1. 2. 3.)
- Use **bold** for party names, case names, and important legal terms
- Use *italics* for case citations and legal references
- Use > for quoted text or legal provisions
- Preserve the logical flow and legal reasoning structure

`;

    if (examples.length > 0) {
      prompt += "\nHere are examples of good conversions:\n\n";
      examples.forEach((example, index) => {
        prompt += `Example ${index + 1} (${example.pleadingType}):\n`;
        prompt += `Original:\n${example.originalText}\n\n`;
        prompt += `Converted:\n${example.convertedMarkdown}\n\n`;
      });
    }

    prompt += `\nNow convert this legal pleading:\n\n${text}\n\nProvide only the clean markdown conversion:`;

    return prompt;
  }

  private static async callOpenAI(prompt: string, settings: ConversionSettings, provider: LLMProvider) {
    if (!settings.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens ?? 0
    };
  }

  private static async callAnthropic(prompt: string, settings: ConversionSettings, provider: LLMProvider) {
    if (!settings.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: settings.maxTokens,
        temperature: settings.temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
    };
  }

  private static async callGroq(prompt: string, settings: ConversionSettings, provider: LLMProvider) {
    if (!settings.apiKey) {
      throw new Error('Groq API key is required');
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API request failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens ?? 0
    };
  }

  private static async callCustomAPI(prompt: string, settings: ConversionSettings, provider: LLMProvider) {
    // Use custom base URL if provided, otherwise fall back to provider default
    const baseUrl = settings.customBaseUrl || provider.baseUrl;
    const model = settings.customModel || 'custom';

    if (!baseUrl) {
      throw new Error('Custom base URL is required for local LLM');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local API request failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens ?? 0
    };
  }
}