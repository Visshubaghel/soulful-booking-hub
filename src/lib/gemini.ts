import { GoogleGenerativeAI, FunctionDeclaration, SchemaType, ChatSession } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

// MOCK FUNCTION FOR FUTURE ADMIN PORTAL
// Currently it just simulates returning a true/false for booking slot
const mockCheckAvailability = async ({ date, time }: { date: string, time: string }) => {
  console.log(`[API Call] Checking availability for ${date} at ${time}`);
  
  // Later you can replace this with an actual fetch call to your backend:
  // const res = await fetch(`/api/slots/check?date=${date}&time=${time}`)
  // return await res.json()
  
  return { 
    available: true, 
    message: `Yes, we do have a slot available on ${date} at ${time}. Currently less than 10 patients are booked for this slot. Please navigate to the Contact page to formally submit your details.`
  };
};

const systemInstruction = `
You are the helpful live assistant for Soulful Booking Hub / Radiance Skin Clinic.
Your name is "Soulful Assistant".
You help patients book appointments, learn about facilities, and ask general questions.
Keep answers extremely friendly, empathetic, professional, and relatively short. DO NOT write long essays.

Key facts about the clinic:
- Name: Radiance Skin Clinic 
- Address: 123 Skin Care Road, New Delhi, India - 110001
- Phone: +91 123 456 7890 (or +918269270775 for WhatsApp)
- Email: info@radianceclinic.com
- Hours: Monday - Saturday, 10:30 AM - 7:00 PM
- Services provided: Skin Care, Hair Care, Body Care, Dermatology Consultations.

When a patient asks to check availability for an appointment, you MUST ALWAYS use the 'check_availability' tool to verify if the slot has fewer than 10 patients BEFORE you say yes.
If they just ask generally how to book, guide them to use the "Contact" page or the floating WhatsApp button on the bottom right.
`;

const checkAvailabilityDeclaration: FunctionDeclaration = {
  name: "check_availability",
  description: "Check if a specific time slot is available for booking, verifying we haven't hit the 10 patient limit.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: "The date of the appointment in YYYY-MM-DD format.",
      },
      time: {
        type: SchemaType.STRING,
        description: "The time of the appointment, like 2:00 PM.",
      },
    },
    required: ["date", "time"],
  },
};

let chatSessionInstance: ChatSession | null = null;

export const getChatSession = () => {
  if (!chatSessionInstance) {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      tools: [
        {
          functionDeclarations: [checkAvailabilityDeclaration],
        },
      ],
    });

    chatSessionInstance = model.startChat({
      history: [],
    });
  }
  return chatSessionInstance;
};

export const sendMessageToGemini = async (message: string) => {
  const session = getChatSession();
  
  try {
    const result = await session.sendMessage(message);
    const call = result.response.functionCalls()?.[0];
    
    // If the model decides it needs to call our check_availability function
    if (call && call.name === "check_availability") {
      // Call our mock function
      const apiResponse = await mockCheckAvailability(call.args as any);
      
      // Let the model know the result of the function call so it can reply to the user
      const secondResult = await session.sendMessage([{
        functionResponse: {
          name: "check_availability",
          response: apiResponse,
        }
      }]);
      
      return secondResult.response.text();
    }
    
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again or contact us via WhatsApp!";
  }
};
