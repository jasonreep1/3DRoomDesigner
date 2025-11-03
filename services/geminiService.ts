import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Suggestion } from "../components/DesignSuggestions";
import { ChatMessage } from "../components/DesignChatModal";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type ImageData = { base64: string; mimeType: string };

export type PlanResult =
  | { type: 'PROPOSAL'; message: string }
  | { type: 'CLARIFICATION'; message: string }
  | { type: 'WARNING'; message: string };


const handleApiError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to ${context}: ${error.message}`);
    }
    throw new Error(`An unexpected error occurred while trying to ${context}.`);
};

const callGeminiForImage = async (model: string, contents: any): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents,
            config: { responseModalities: [Modality.IMAGE] }
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            return part.inlineData.data;
        }

        throw new Error("No image data found in the API response.");
    } catch (error) {
        handleApiError(error, "generate design");
    }
};

interface FullDesignParams {
    original?: ImageData;
    previous?: ImageData;
    prompt: string;
    previousPrompt?: string;
    critiqueFeedback?: string | null;
}

export const generateFullImageDesign = async ({ original, previous, prompt, previousPrompt, critiqueFeedback }: FullDesignParams): Promise<string> => {
    let instructionText: string;

    if (previous && original) {
        instructionText = `You are an expert interior design AI performing a highly precise, localized edit. You will receive two images and a text prompt.

        1.  **THE CANVAS (first image):** This is the image you MUST edit. It is the most recent design.
        2.  **THE BLUEPRINT (second image):** This is the original, unedited photo of the room. Use it ONLY as a structural reference for the room's shape, perspective, and lighting.
        3.  **THE PROMPT:** "${prompt}"`;

        if (previousPrompt) {
            instructionText += `\n\n**CONTEXT:** The previous user instruction was: "${previousPrompt}". The user is now providing a follow-up instruction to refine that change.`;
        }

        if (critiqueFeedback) {
            instructionText += `\n\n**CORRECTIVE ACTION:** Your previous attempt failed. The critique was: "${critiqueFeedback}". Please address this feedback directly in your new attempt. Pay close attention to making the requested change while adhering to all other rules.`;
        }
    } else if (original) {
         instructionText = `This is an image of a room. Generate a photorealistic new image of the same room, from the exact same camera angle, but with the following changes and additions based on this description: "${prompt}". Ensure the final image is a high-quality, realistic rendering of the redesigned space.`;
    } else {
        throw new Error("generateFullImageDesign requires at least an 'original' image for initial generation, or both 'original' and 'previous' for refinement.");
    }

    instructionText += `\n\n---
    **CORE DIRECTIVES FOR IMAGE GENERATION**

    **1. STRONG BIAS FOR ACTION:**
    - Your primary goal is to execute the user's prompt. Returning an unchanged image is an absolute failure.
    - If a prompt is challenging or ambiguous, you MUST make a plausible, high-quality, and aesthetically pleasing interpretation. DO NOT do nothing.

    **2. INTELLIGENT PRESERVATION:**
    - This is the defining characteristic of your skill: making a significant change to one part of the image while the untouched areas remain **visually identical to an observer**.
    - This is NOT a "pixel-perfect" rule. You have the creative latitude to realistically blend your changes with surrounding lighting, shadows, reflections, and textures. For example, changing a sofa's color will naturally affect its shadow on the floor. This is expected and correct.
    - DO NOT revert to or copy content from the original blueprint photo. Reverting is a failure. Your canvas is the most recent design.
    ---`;

    const parts: any[] = [];
    if (previous) parts.push({ inlineData: { data: previous.base64, mimeType: previous.mimeType } });
    if (original) parts.push({ inlineData: { data: original.base64, mimeType: original.mimeType } });
    parts.push({ text: instructionText });

    const contents = { parts };
    return callGeminiForImage('gemini-2.lhs-image', contents);
};


export const generateCleanedImage = async (
  { base64, mimeType }: ImageData,
  level: 'tidy' | 'empty'
): Promise<string> => {
    let instructionText: string;
    if (level === 'tidy') {
        instructionText = `You are an expert interior design AI specializing in tidying up. This is an image of a room. Generate a photorealistic new image of the exact same room, from the same camera angle, but remove all small clutter. Clutter includes items like stray papers, books, clothes on the floor, small decorative objects, toys, and cables. The main furniture (sofas, beds, tables, chairs), walls, windows, and flooring should remain, but can be tidied (e.g., smooth bed covers). The goal is a clean, tidy version of the same room.`;
    } else { // 'empty'
        instructionText = `You are an expert interior design AI specializing in creating a blank canvas. This is an image of a room. Generate a photorealistic new image of the exact same room, from the same camera angle, but remove ALL furniture and decorative items. The core architectural elements (walls, windows, doors, flooring, ceiling, permanent fixtures) must remain. The goal is to show a completely empty version of the room, repairing the walls and floor where furniture used to be, ready for a complete redesign.`;
    }

  const contents = {
    parts: [
      { inlineData: { data: base64, mimeType } },
      { text: instructionText },
    ],
  };

  return callGeminiForImage('gemini-2.5-flash-image', contents);
};

export const generateMaskedImageDesign = async (
  base64Image: string,
  mimeType: string,
  base64Mask: string,
  prompt: string,
  previousPrompt?: string
): Promise<string> => {
  let instructionText = `You are a precision in-painting AI. Your task is to edit the first image, using the second image as a mask. Your primary goal is to apply the user's instruction within the white areas of the mask. The black areas of the mask indicate protected regions that should remain unchanged. Strive to keep these black areas identical to the original image. When removing an object, realistically fill the background to match its surroundings.`;

  if (previousPrompt) {
    instructionText += `\n\n**CONTEXT:** The previous user instruction was: "${previousPrompt}". The user is now providing a follow-up instruction for the masked area.`;
  }

  instructionText += `\nThe user's instruction for the masked area is: "${prompt}".`;

  const contents = {
    parts: [
      { inlineData: { data: base64Image, mimeType } },
      { inlineData: { data: base64Mask, mimeType: 'image/png' } },
      { text: instructionText },
    ],
  };

  return callGeminiForImage('gemini-2.5-flash-image', contents);
};

export const generateCreativeImageEdit = async (
  { base64, mimeType }: ImageData,
  prompt: string,
): Promise<string> => {
  const instructionText = `You are an expert at creative image editing. Edit the provided image based on the following instruction: "${prompt}". The output should be a new photorealistic image reflecting the requested change. Do not just add a filter, fundamentally alter the image content as requested.`;

  const contents = {
    parts: [
      { inlineData: { data: base64, mimeType } },
      { text: instructionText },
    ],
  };

  return callGeminiForImage('gemini-2.5-flash-image', contents);
};

const planResultSchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            enum: ["PROPOSAL", "CLARIFICATION", "WARNING"],
            description: "The type of response based on your analysis of the user's prompt."
        },
        message: {
            type: Type.STRING,
            description: "The message to display to the user. This will be your design proposal, a clarifying question, or an aesthetic warning."
        }
    },
    required: ['type', 'message']
};


export const planAndConfirmRefinement = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  useAdvanced: boolean = false,
  base64Mask?: string | null
): Promise<PlanResult> => {
  const modelName = useAdvanced ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

  let instructionText: string;
  const parts: any[] = [{ inlineData: { data: base64Image, mimeType } }];

  if (base64Mask) {
    parts.push({ inlineData: { data: base64Mask, mimeType: 'image/png' } });
    instructionText = `You are an expert AI interior design assistant. You have been provided with two images and a user request. Your goal is to analyze the request and create a design proposal.

    - **Image 1 (The Design):** The main interior design image.
    - **Image 2 (The Mask):** A black and white mask. The user's request applies ONLY to the white areas of this mask. Black areas are protected and must not be changed.

    **User's Request:** "${prompt}"

    ---
    **YOUR TASK**

    Analyze the user's request in the context of the masked area. Formulate a "Design Proposal" that clearly acknowledges the masked edit. Your proposal must:
    1. State what you will do within the selected area.
    2. Confirm that the changes will be limited ONLY to that area.

    **Example Proposal:** "Okay, my plan is to remove the items within the selected area and then realistically repair the wall behind them. The rest of the image will remain untouched. Shall I proceed?"

    Now, based on the user's request, formulate your response. Your response MUST be a JSON object with two keys: "type" (string, which MUST be "PROPOSAL" for this task) and "message" (a string containing your proposal).`;
  } else {
    instructionText = `You are an expert AI interior design assistant acting as a project manager. Your goal is to analyze a user's design request and determine the best course of action. You must choose one of three paths based on the user's prompt and the provided image.

      User's Request: "${prompt}"

      ---
      **DECISION TRIAGE**

      **1. High/Moderate Ambiguity or High Confidence (Respond with PROPOSAL):**
      - This is the default path for most requests.
      - If the request is clear and direct (e.g., "Change the sofa to green"), create a detailed "Design Proposal" that identifies the object, states the action, and guarantees preservation of other elements.
      - If the request is stylistic or abstract (e.g., "Make it feel more 'Japandi'"), **interpret** it into a concrete plan and present that as your proposal. Do not ask what 'Japandi' means; propose a specific implementation of it.
      - If the request is clear but might clash with the current design (e.g., "Add a pink shag carpet to this minimalist room"), formulate it as a proposal but use the 'WARNING' type instead. The message should gently state the potential clash and ask for confirmation.
      - **Example PROPOSAL message:** "Okay, here is my plan: I will target the grey three-seater sofa and change its color to a deep navy blue. I will ensure the rest of the room, including the walls and other decor, remains completely unchanged. Shall I proceed?"
      - **Example WARNING message:** "I can certainly change the floor to a bright pink shag carpet. Just to confirm, this would be a significant departure from the room's current modern aesthetic. Are you sure you'd like to proceed?"

      **2. High Ambiguity / Technically Blocked (Respond with CLARIFICATION):**
      - Use this path ONLY if the prompt is impossible to execute without more information.
      - This applies if you cannot identify the target object ("change the doodad"), the location is vague ("add a plant over there"), or the command is contradictory.
      - Your message must be a specific question that guides the user on how to fix their prompt.
      - **Example CLARIFICATION message:** "I can't seem to identify the 'doodad' you're referring to. Could you describe it for me, or use the 'Edit Area' tool to select it?"
      ---

      Your response MUST be a JSON object with two keys: "type" (a string: "PROPOSAL", "CLARIFICATION", or "WARNING") and "message" (a string containing your response to the user).`;
  }

  parts.push({ text: instructionText });

  const contents = { parts };
  const config = {
    responseMimeType: "application/json",
    responseSchema: planResultSchema,
  };

  try {
    const response = await ai.models.generateContent({ model: modelName, contents, config });
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
     if (['PROPOSAL', 'CLARIFICATION', 'WARNING'].includes(parsed.type) && typeof parsed.message === 'string') {
        return parsed as PlanResult;
    }
    throw new Error("Invalid JSON structure in API response for plan.");
  } catch (error) {
    handleApiError(error, "plan and confirm refinement prompt");
  }
};


export const describeImageChanges = async (
  previousImage: ImageData,
  newImage: ImageData,
  prompt: string,
  useAdvanced: boolean = false
): Promise<string> => {
  const modelName = useAdvanced ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const contents = {
    parts: [
      { inlineData: { data: previousImage.base64, mimeType: previousImage.mimeType } },
      { inlineData: { data: newImage.base64, mimeType: newImage.mimeType } },
      { text: `You are an AI interior designer. You were given the first image ('before') and the prompt "${prompt}", and you produced the second image ('after'). Briefly describe the changes you made in a confident, past-tense, and user-friendly tone. Start your response with "Okay, I've...". For example: "Okay, I've replaced the blue armchair with a modern leather sofa and added a large potted plant in the corner."` },
    ],
  };
  try {
    const response = await ai.models.generateContent({ model: modelName, contents });
    return response.text.trim();
  } catch (error) {
    console.error(`Error calling Gemini API for describeImageChanges:`, error);
    return "Change description could not be generated.";
  }
};

export const chatWithDesignAI = async (
    imageData: ImageData,
    chatHistory: ChatMessage[],
    newUserMessage: string
): Promise<string> => {
    const systemInstruction = `You are an expert interior design assistant. Your goal is to be a helpful, knowledgeable collaborator, helping the user brainstorm ideas for redesigning a room from a provided image.

    **Normal Conversation Mode:**
    - Answer questions about design principles, styles, color theory, and object identification.
    - Provide creative suggestions and help the user refine their ideas.
    - Keep responses concise, conversational, and text-only.

    **Design Plan Mode:**
    - If the user's message is exactly "_FINALIZE_DESIGN_PLAN_", your role changes.
    - **Step 1:** Review the entire conversation to understand the user's goals.
    - **Step 2:** Generate a concise, bulleted summary of the key decisions and changes under the markdown heading "**Design Plan Summary**".
    - **Step 3:** Based on the plan, write a single, clear, and highly effective instruction for a separate image generation AI under the markdown heading "**Recommended Prompt**". This prompt should be a direct, actionable command, optimized for the best visual result (e.g., using verbs like 'Replace', 'Add', 'Change').
    - Your entire response for this mode must follow this two-part structure.`;

    const contents: any[] = [];

    // Construct history for the stateless generateContent call
    const fullHistory = [
      {
        role: 'user',
        parts: [
          { inlineData: { data: imageData.base64, mimeType: imageData.mimeType } },
          { text: 'This is the room we are discussing. Start the conversation.' }
        ]
      },
      { role: 'model', parts: [{ text: "Okay, I see the room. How can I help you with your design today?" }] },
      ...chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
      })),
      {
          role: 'user',
          parts: [{ text: newUserMessage }]
      }
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullHistory,
        config: { systemInstruction }
      });
      return response.text.trim();
    } catch (error) {
        handleApiError(error, "chat with design AI");
    }
};


const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A short, catchy title for the design style (e.g., "Modern Minimalist").'
            },
            description: {
              type: Type.STRING,
              description: 'A detailed description of the design changes, written as a user-facing prompt.'
            }
          },
          required: ["title", "description"]
        }
      }
    },
    required: ["suggestions"]
};

const roomDetailsSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A concise, one-paragraph description of the room's current state, style, and contents."
    },
    materials: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of strings listing the primary materials identified in the room (e.g., 'Oak Wood', 'Brushed Steel', 'Cotton Fabric', 'Glass')."
    }
  },
  required: ['description', 'materials']
};

const critiqueSchema = {
    type: Type.OBJECT,
    properties: {
      success: {
        type: Type.BOOLEAN,
        description: "True if the user's prompt was successfully applied, false otherwise."
      },
      reason: {
        type: Type.STRING,
        description: "A brief, one-sentence explanation for the success or failure."
      }
    },
    required: ['success', 'reason']
};

export const critiqueGeneratedImage = async (
    previousImage: ImageData,
    newImage: ImageData,
    prompt: string
): Promise<{ success: boolean; reason: string }> => {
    const contents = {
        parts: [
            { inlineData: { data: previousImage.base64, mimeType: previousImage.mimeType } }, // Before
            { inlineData: { data: newImage.base64, mimeType: newImage.mimeType } },       // After
            { text: `You are a meticulous AI Quality Assurance agent. Your task is to provide a critical analysis of an image generation task. You will be given a 'before' image, an 'after' image, and the user's prompt.

            User Prompt: "${prompt}"

            **Follow this process exactly:**

            **Step 1: Identity Check.**
            Compare the 'before' and 'after' images. Are they visually identical or functionally identical (e.g., only tiny, meaningless pixel noise is different)?

            **Step 2: Formulate Your Reason based on the Identity Check.**

            *   **If YES, the images are identical:**
                This is a **FAILURE**. Your 'reason' MUST provide a helpful, speculative explanation for *why* the AI failed to make a change. You are FORBIDDEN from simply stating that the image is unchanged.
                - **Analyze the prompt:** Is it too abstract (e.g., "make it feel cozier")? Too ambiguous? Asking for something impossible?
                - **Provide actionable advice:** Suggest a more concrete prompt or a different tool.
                - **Correct Example Reason:** "The request to 'make the room feel more spacious' was likely too abstract for the AI to interpret visually. Try a more specific action, like 'use a lighter color on the walls' or 'replace the bulky coffee table with a smaller glass one.'"
                - **Correct Example Reason:** "The AI may have struggled to isolate and change the small vase on the cluttered shelf. For precise edits like this, using the 'Edit Area' tool to select the vase first will yield better results."
                - **INCORRECT (FORBIDDEN) REASON:** "The image was not changed." or "The prompt was not followed."

            *   **If NO, the images are different:**
                Now, you must evaluate the success of the change.
                - Was the user's core request from the prompt fulfilled?
                - Were there any unintended, negative changes to other parts of the image?
                - Is the image quality good?
                - If the change is successful, the 'reason' should be a simple confirmation like "The change was applied successfully."
                - If the change is a failure (e.g., it changed the wrong object, the quality is poor, or it introduced bizarre artifacts), the 'reason' MUST be a specific, visual description of the failure.
                - **Correct Failure Reason:** "The armchair was changed to red instead of the requested green."
                - **Correct Failure Reason:** "A bookshelf was added, but the wall texture behind it is distorted."
                - **INCORRECT (FORBIDDEN) REASON:** "The edit was unsuccessful."

            Your final output must be a JSON object with your conclusion.` },
        ],
    };

    const config = {
        responseMimeType: "application/json",
        responseSchema: critiqueSchema,
    };

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        console.log("Critique result:", parsed);
        if (typeof parsed.success === 'boolean' && typeof parsed.reason === 'string') {
            return parsed;
        }
        throw new Error("Invalid JSON structure in API response for critique.");
    } catch (error) {
        handleApiError(error, "critique generated image");
    }
};

export const analyzeImageForRoomDetails = async (
  base64Image: string,
  mimeType: string,
  useAdvanced: boolean = false
): Promise<{ description: string; materials: string[] }> => {
  const contents = {
    parts: [
      { inlineData: { data: base64Image, mimeType } },
      { text: "Analyze this image of a room to prepare for design modifications. Provide a concise description of its current state and list the primary materials you can identify. Return the analysis as a JSON object." },
    ],
  };

  const modelName = useAdvanced ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: roomDetailsSchema,
  };

  if (useAdvanced) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response = await ai.models.generateContent({ model: modelName, contents, config });
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    if (parsed.description && Array.isArray(parsed.materials)) {
      return parsed;
    }
    throw new Error("Invalid JSON structure in API response for room details.");
  } catch (error) {
    handleApiError(error, "analyze image for room details");
  }
};

const _analyzeImageForSuggestions = async (
    base64Image: string,
    mimeType: string,
    useAdvanced: boolean,
    prompt: string
): Promise<Suggestion[]> => {
    const contents = {
        parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }],
    };

    const modelName = useAdvanced ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config: any = {
        responseMimeType: "application/json",
        responseSchema: suggestionSchema,
    };

    if (useAdvanced) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    try {
        const response = await ai.models.generateContent({ model: modelName, contents, config });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            return parsed.suggestions;
        }
        throw new Error("Invalid JSON structure in API response.");
    } catch (error) {
        handleApiError(error, "analyze image for suggestions");
    }
};

export const analyzeImageForSuggestions = async (
  base64Image: string,
  mimeType: string,
  useAdvanced: boolean = false
): Promise<Suggestion[]> => {
  const prompt = "Analyze this image of a room. Identify its current style, key features, and potential. Then, provide exactly three distinct and creative interior design suggestions to transform the space. For each suggestion, provide a short, catchy title and a detailed description formatted as a prompt that a user could give to an AI to generate the new design.";
  return _analyzeImageForSuggestions(base64Image, mimeType, useAdvanced, prompt);
};

export const analyzeImageForRefinements = async (
    base64Image: string,
    mimeType: string,
    useAdvanced: boolean = false
): Promise<Suggestion[]> => {
    const prompt = "Analyze this AI-generated interior design. Provide exactly three distinct and creative suggestions for further refinement. The suggestions could involve changing colors, adding decor, altering furniture, or adjusting lighting. For each suggestion, provide a short, catchy title and a detailed description formatted as a prompt that a user could give to an AI to generate the refinement.";
    return _analyzeImageForSuggestions(base64Image, mimeType, useAdvanced, prompt);
};
