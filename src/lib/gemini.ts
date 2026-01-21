import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface ParsedExpense {
    date?: string; // DD.MM.YYYY
    amount: number;
    currency: string;
    category?: string;
    description?: string;
    merchant?: string;
    warnings: string[];
    isBoardingPass: boolean;
    rawResponse?: any;
}

export async function parseReceipt(
    imagePart: { inlineData: { data: string; mimeType: string } }
): Promise<ParsedExpense> {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    Analyze this receipt/document (image or PDF) and extract the following information in JSON format:
    - date (DD.MM.YYYY format)
    - amount (total amount, as a number)
    - currency (e.g., TRY, USD, EUR)
    - merchant (name of the place)
    - category (suggest a category like Food, Transport, Accommodation, Office Supplies, etc.)
    - description (brief description of items)
    - isBoardingPass (boolean, true if it looks like a plane/bus ticket or boarding pass)
    - isInfoSlip (boolean, true if it says "Bilgi Fişi", "Mali Değeri Yoktur" or seemingly has no financial value)

    Special Rules:
    1. If 'isInfoSlip' is true, set the amount to 0.
    2. If 'isBoardingPass' is true, add a warning: "Lütfen biniş kartınızı saklayınız."
    3. If 'isInfoSlip' is true, add a warning: "Bu belge bilgi fişidir, mali değeri yoktur."
  `;

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text); // Debug log

        // Clean up markdown code blocks if present
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
                warnings: warnings,
                isBoardingPass: data.isBoardingPass || false,
                rawResponse: data
            };
        } catch (jsonError) {
            console.error("JSON Parse Error:", jsonError);
            throw new Error(`AI yanıtı okunamadı: ${text.substring(0, 50)}...`);
        }

    } catch (error: any) {
        console.error("Error parsing receipt with Gemini:", error);
        // Extract meaningful message
        const msg = error?.response?.data?.error?.message || error.message || "Bilinmeyen hata";
        throw new Error(`AI Servis Hatası: ${msg}`);
    }
}
