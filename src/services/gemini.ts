import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeResume(
  jobDescription: string,
  resumeText: string
): Promise<AnalysisResult> {
  const prompt = `
    You are an expert HR recruiter. Analyze the provided resume against the job description.
    
    Job Description:
    ${jobDescription}
    
    Candidate Resume:
    ${resumeText}
    
    Strictly evaluate the fit and return:
    1. Status: 'Accepted' (if > 80% match), 'Rejected' (if < 40% match), or 'Review' (if in between or certain critical doubts exist).
    2. Score: A total numerical match score from 0 to 100.
    3. Score Breakdown: Individual scores (0-100) for Skills, Experience, and Education.
    4. Feedback: A concise summary of why they were categorized this way, mentioning specific skills match or gaps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "The categorization: Accepted, Rejected, or Review",
              enum: ["Accepted", "Rejected", "Review"],
            },
            score: {
              type: Type.NUMBER,
              description: "Total match score from 0-100",
            },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.NUMBER, description: "Skills match score" },
                experience: { type: Type.NUMBER, description: "Experience match score" },
                education: { type: Type.NUMBER, description: "Education match score" },
              },
              required: ["skills", "experience", "education"],
            },
            feedback: {
              type: Type.STRING,
              description: "Concise reasoning for the categorization",
            },
          },
          required: ["status", "score", "scoreBreakdown", "feedback"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      status: "Review",
      score: 0,
      scoreBreakdown: { skills: 0, experience: 0, education: 0 },
      feedback: "Failed to analyze resume. Please review manually.",
    };
  }
}
