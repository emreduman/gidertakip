import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface ParsedExpense {
    date?: string; // DD.MM.YYYY
    amount: number;
    currency: string;
    category?: string;
    description?: string;
    merchant?: string;
    taxRate?: number;
    taxAmount?: number;
    confidence: number;
    warnings: string[];
    isBoardingPass: boolean;
    rawResponse?: any;
}

export async function parseReceipt(
    imagePart: { inlineData: { data: string; mimeType: string } },
    customPrompt?: string | null
): Promise<ParsedExpense> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
    Analyze this receipt/document (image or PDF) and extract the following information in JSON format:
    - date (DD.MM.YYYY format)
    - amount (total amount, as a number)
    - currency (e.g., TRY, USD, EUR)
    - merchant (name of the place)
    - category (suggest a category like Food, Transport, Accommodation, Office Supplies, etc.)
    - description (brief description of items)
    - taxRate (the VAT/KDV rate applied, e.g. 10, 20. If multiple, use the highest or most prominent. Treat as percentage number)
    - taxAmount (the total VAT/KDV amount extracted from the receipt, as a number)
    - confidence (a number between 0 and 100 indicating how confident you are in your reading and categorization)
    - isBoardingPass (boolean, true if it looks like a plane/bus ticket or boarding pass)
    - isInfoSlip (boolean, true if it says "Bilgi Fişi", "Mali Değeri Yoktur" or seemingly has no financial value)

    Special Rules:
    1. If 'isInfoSlip' is true, set the amount to 0.
    2. If 'isBoardingPass' is true, add a warning: "Lütfen biniş kartınızı saklayınız."
    3. If 'isInfoSlip' is true, add a warning: "Bu belge bilgi fişidir, mali değeri yoktur."

    ${customPrompt ? `---
    Custom Bot Persona/Instructions:
    ${customPrompt}
    (Keep this persona in mind or reflect it in warnings/description if specifically requested, but you must still output strictly valid JSON matching the requested structure).
    ---` : ''}
  `;

    let attempt = 0;
    const maxRetries = 3;
    let lastError: any = null;

    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            console.log("Gemini Raw Response:", text); // Debug log

            // Clean up markdown code blocks if present //
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const data = JSON.parse(cleanText);

                const warnings: string[] = [];
                let amount = data.amount;

                if (data.isInfoSlip) {
                    amount = 0;
                    warnings.push("Bu belge bilgi fişidir, mali değeri yoktur.");
                }

                if (data.isBoardingPass) {
                    warnings.push("Lütfen biniş kartınızı saklayınız.");
                }

                return {
                    date: data.date,
                    amount: amount,
                    currency: data.currency || "TRY",
                    category: data.category,
                    description: data.description,
                    merchant: data.merchant,
                    taxRate: data.taxRate,
                    taxAmount: data.taxAmount,
                    confidence: data.confidence || 50,
                    warnings: warnings,
                    isBoardingPass: data.isBoardingPass || false,
                    rawResponse: data
                };
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError);
                throw new Error(`AI yanıtı okunamadı: ${text.substring(0, 50)}...`);
            }

        } catch (error: any) {
            console.error(`Error parsing receipt with Gemini (Attempt ${attempt + 1}/${maxRetries}):`, error);
            lastError = error;
            
            const msg = error?.response?.data?.error?.message || error.message || "";
            // Check if it's a 503 or 429 error, which indicates temporary unavailability or rate limit
            if (msg.includes("503") || msg.includes("429") || msg.includes("Service Unavailable") || msg.includes("overloaded") || msg.includes("high demand")) {
                attempt++;
                if (attempt < maxRetries) {
                    const backoffMs = attempt * 2000;
                    console.log(`Gemini API overloaded. Retrying in ${backoffMs} ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                    continue;
                }
            }
            // If it's a different error or we've exhausted retries, break out
            break;
        }
    }

    // Extract meaningful message from the last error
    const msg = lastError?.response?.data?.error?.message || lastError?.message || "Bilinmeyen hata";
    throw new Error(`AI Servis Hatası: ${msg}`);
}

export async function analyzeReceiptWithGemini(
    fileUrl: string,
    mimeType: string,
    fileBuffer: Buffer,
    customPrompt?: string | null
): Promise<{
    date: Date;
    amount: number;
    category?: string;
    description?: string;
    merchant?: string;
    taxRate?: number;
    taxAmount?: number;
    confidence: number;
    warnings: string[];
}> {
    // Determine the base64 string
    const base64Data = fileBuffer.toString("base64");

    // Call the existing parseReceipt function
    const parsed = await parseReceipt({
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    }, customPrompt);

    // Handle date formatting
    let parsedDate = new Date();
    if (parsed.date) {
        // Assume DD.MM.YYYY
        const parts = parsed.date.split('.');
        if (parts.length === 3) {
            parsedDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
    }

    return {
        date: parsedDate,
        amount: Number(parsed.amount) || 0,
        category: parsed.category,
        description: parsed.description,
        merchant: parsed.merchant,
        taxRate: Number(parsed.taxRate) || 0,
        taxAmount: Number(parsed.taxAmount) || 0,
        confidence: Number(parsed.confidence) || 0,
        warnings: parsed.warnings || [],
    };
}
