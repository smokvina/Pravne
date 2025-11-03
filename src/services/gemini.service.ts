import { Injectable } from '@angular/core';
// FIX: Imported `Type` to define the response schema for the Gemini API call.
import { GoogleGenAI, Type } from '@google/genai';
import { ContractInput, GenerationResult, OcrResult } from '../models';

// This is a placeholder for the API key.
// In a real environment, this would be securely managed.
const API_KEY = process.env.API_KEY;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!API_KEY) {
        console.error("API_KEY is not set. Please set the API_KEY environment variable.");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async analyzeImage(base64Image: string, mimeType: string): Promise<OcrResult> {
    if (!API_KEY) {
       throw new Error("API Key not configured.");
    }
    try {
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      };
      const textPart = {
        text: 'Extract all text from this image of an ID card. Provide the response as a JSON object with two keys: "rawText" (containing the full extracted text, preserving line breaks) and "uncertainFields" (an array of objects, where each object has "field", "value", and "reason" for any data you are not confident about, e.g., due to blurriness, glare, or unusual formatting). If you are confident about all fields, return an empty array for "uncertainFields".',
      };
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        // FIX: Added a responseSchema to ensure consistent JSON output from the Gemini API for OCR.
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rawText: {
                  type: Type.STRING,
                  description: "The full extracted text from the ID card, preserving line breaks."
                },
                uncertainFields: {
                  type: Type.ARRAY,
                  description: "A list of fields where the OCR confidence is low.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      field: { type: Type.STRING, description: "The name of the uncertain field (e.g., 'Datum isteka')." },
                      value: { type: Type.STRING, description: "The extracted value for the field, including uncertain characters." },
                      reason: { type: Type.STRING, description: "The reason for uncertainty (e.g., 'Blurry text', 'Glare on photo')." },
                    },
                    required: ["field", "value", "reason"]
                  }
                }
              },
              required: ["rawText", "uncertainFields"]
            }
        }
      });

      const resultText = response.text;
      try {
        // With responseSchema, the result should be a valid JSON string.
        return JSON.parse(resultText);
      } catch (e) {
        console.error('Failed to parse JSON from OCR analysis:', e);
        return { rawText: resultText, uncertainFields: [{ field: 'N/A', value: 'Could not parse structured OCR response.', reason: 'AI did not return valid JSON despite schema.' }] };
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      return { rawText: `Error analyzing image: ${(error as Error).message}`, uncertainFields: [] };
    }
  }

  async generateContract(data: ContractInput): Promise<GenerationResult> {
    if (!API_KEY) {
       throw new Error("API Key not configured.");
    }
    
    // FIX: Removed unused 'model' variable.
    const mainPrompt = `
You are a professional legal-drafting assistant. Generate a clear, precise contract draft in Croatian based on the structured input below. Return output in two parts: (A) human-readable contract in Croatian (Markdown) and (B) JSON metadata with placeholders and version info.

INPUT:
${JSON.stringify(data, null, 2)}

REQUIREMENTS:
1. Uvrsti uvod s naslovom i kratkim opisom svrhe ugovora.
2. Navedite jasno identifikacijske podatke svake strane (ime, uloga, OIB/ID, adresa, kontakt).
3. Izlistajte obveze i prava svake strane jasno i numerirano.
4. Uključite klauzule za trajanje ugovora, raskid, odgovornost, rješavanje sporova (nadležnost i način), zaštitu podataka (GDPR-friendly), potpise i datum.
5. Dodajte klauzulu o mjerodavnom pravu. Ako nije drugačije navedeno, ugovor se ravna prema zakonima Republike Hrvatske.
6. Ako su u 'contract_purpose' ili u OCR poljima naznačeni iznosi, datumi ili posebni uvjeti — uključite ih u relevantne članke.
7. Na kraju generiraj odjeljak "Provjera podataka". U ovom odjeljku, izlistaj sve podatke preuzete iz OCR-a. Za polja koja su označena kao nesigurna u 'id_card_front_uncertain_fields' ili 'id_card_back_uncertain_fields', jasno navedi polje, izvučenu vrijednost i razlog nesigurnosti (npr., "Datum isteka: 1?/07/2025 [POTVRDITE - Razlog: Znak '?' je nejasan zbog odbljeska.]"). Nemojte pretpostavljati vrijednosti.
8. Vraćeni JSON metadata mora sadržavati: { version: "1.0", generated_at_ISO: "...", parties_summary: [{name, role}], clauses_summary: ["clause title 1", "clause title 2"], placeholders_used: ["{{placeholder1}}"] }.

ADDITIONAL:
- Ako 'additional_instructions' traže „jednostavan jezik“ napravi opciju „legal plain-language“ na dnu koja sažima obveze u 3-4 rečenice. 
- Ako ulaz sadrži više osoba s iste strane (npr. više prodavatelja) — generiraj tablicu s osobama i njihovim ulogama.

PRIVACY & SAFETY: Treat all personal data as sensitive. Use neutral legal phrasing.

OUTPUT FORMAT:
- First, return the complete, professional contract in Croatian (Markdown).
- Then, on a new line, write the exact separator string "---JSON_METADATA---".
- Finally, on a new line after the separator, write the JSON object with the metadata. Do not include any markdown formatting like \`\`\`json.
`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", // Using flash for faster response in this interactive app.
        contents: mainPrompt,
        config: {
            // Per instructions to use thinking mode with pro, but flash is better for this app's speed.
            // If more complexity is needed, switching to pro with thinkingBudget is an option.
            // thinkingConfig: { thinkingBudget: 32768 } 
        }
      });
      const fullText = response.text;
      
      const parts = fullText.split('---JSON_METADATA---');
      if (parts.length < 2) {
        throw new Error('Invalid response format from API. Could not find metadata separator.');
      }

      return {
        markdown: parts[0].trim(),
        json: parts[1].trim(),
      };
    } catch (error) {
      console.error('Error generating contract:', error);
      throw new Error(`Failed to generate contract: ${(error as Error).message}`);
    }
  }
}
