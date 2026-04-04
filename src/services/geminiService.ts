import { GoogleGenAI, Type } from "@google/genai";

/**
 * Analyzes raw credential data using Gemini 2.0 Flash.
 * Acts as a strict Medical Services Professional (MSP) auditor.
 */
export async function analyzeReadiness(data: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const systemInstruction = `
    You are a strict Medical Services Professional (MSP) auditor. 
    Your task is to analyze raw healthcare provider credentialing data and generate an "audit-ready" synthesis for employers.
    
    You must evaluate:
    1. Verified Credentials: What is confirmed by primary sources.
    2. Identified Gaps/Risks: Any missing data, pending enrollments, or potential red flags.
    3. Estimated Time to Start: A realistic projection based on the current state of the packet.
    
    Be concise, technical, and objective.
  `;

  const prompt = `
    Analyze this provider data:
    NPI: ${data.npi}
    Identity (NPPES): ${JSON.stringify(data.identity)}
    Sanctions (OIG): ${JSON.stringify(data.sanctions)}
    Licensure (FSMB): ${JSON.stringify(data.licensure)}
    Enrollment (PECOS): ${JSON.stringify(data.pecos)}
    Readiness Score: ${data.readinessScore}%
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verifiedCredentials: {
              type: Type.STRING,
              description: "Summary of verified primary source data.",
            },
            identifiedGaps: {
              type: Type.STRING,
              description: "List of missing items or identified risks.",
            },
            estimatedTimeToStart: {
              type: Type.STRING,
              description: "Realistic timeline for the provider to begin work.",
            },
          },
          required: ["verifiedCredentials", "identifiedGaps", "estimatedTimeToStart"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini MSP Audit failed:", error);
    return {
      verifiedCredentials: "Error synthesizing source data.",
      identifiedGaps: "Manual review required due to system timeout.",
      estimatedTimeToStart: "TBD",
    };
  }
}

/**
 * Generates a tailored cover letter using Gemini 2.0 Flash.
 */
export async function generateCoverLetter(resume: string, jobDescription: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const systemInstruction = `
    You are an expert career consultant and professional writer specializing in healthcare and clinical roles. 
    Your task is to generate a highly tailored, compelling, and professional cover letter.
    
    You must:
    1. Extract relevant skills and experiences from the user's resume.
    2. Identify key requirements and the company's "vibe" from the job description.
    3. Craft a narrative that connects the candidate's qualifications to the specific job.
    4. Use a professional yet engaging tone.
    5. Ensure the letter is concise (3-4 paragraphs).
    6. Focus on clinical excellence, patient care, and professional reliability.
  `;

  const prompt = `
    Resume:
    ${resume}
    
    Job Description:
    ${jobDescription}
    
    Generate a tailored cover letter based on the provided resume and job description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    });

    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    console.error("Gemini Cover Letter generation failed:", error);
    throw new Error("Failed to generate cover letter. Please try again.");
  }
}
