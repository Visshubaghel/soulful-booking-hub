import { GoogleGenerativeAI, FunctionDeclaration, SchemaType, ChatSession } from "@google/generative-ai";

// Load from Vercel environment variable (set as VITE_GEMINI_API_KEY in Vercel project settings)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  console.warn("[Gemini] VITE_GEMINI_API_KEY is not set. The chatbot will not function.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Real availability check — queries the live MongoDB via the /api/slots/available endpoint
const checkAvailability = async ({ date, time }: { date: string; time?: string }) => {
  try {
    const res = await fetch(`/api/slots/available?date=${date}`);
    if (!res.ok) {
      return { available: false, message: "Could not check availability at this time." };
    }
    const data = await res.json();
    const availableSlots: { time: string; spotsLeft: number }[] = data.availableSlots || [];

    if (!time) {
      // No specific time asked — return general overview
      if (availableSlots.length === 0) {
        return { available: false, message: `Sorry, there are no available slots on ${date}. All slots are either blocked or fully booked.` };
      }
      const list = availableSlots.map((s) => `${s.time} (${s.spotsLeft} spots left)`).join(", ");
      return { available: true, message: `On ${date}, the following slots are available: ${list}. Please visit the 'Book Appointment' page to book one.` };
    }

    const match = availableSlots.find(
      (s) => s.time.toLowerCase() === time.toLowerCase()
    );
    if (match) {
      return {
        available: true,
        message: `Yes! The ${time} slot on ${date} is available with ${match.spotsLeft} spot(s) left. Please visit the 'Book Appointment' page to book it.`,
      };
    } else {
      return {
        available: false,
        message: `Sorry, the ${time} slot on ${date} is not available — it is either fully booked or blocked by the clinic. Please try another time.`,
      };
    }
  } catch {
    return { available: false, message: "Unable to check availability right now. Please visit the 'Book Appointment' page directly." };
  }
};

const systemInstruction = `
You are the friendly and helpful live assistant for Soulful Booking Hub (Radiance Skin Clinic).
Your name is "Soulful Assistant".
You help patients: check appointment availability, learn about services, understand how to book, and answer general questions.
Keep answers friendly, empathetic, professional, and concise. Do NOT write long essays.

Key facts about the clinic:
- Name: Radiance Skin Clinic / Soulful Booking Hub
- Address: 123 Skin Care Road, New Delhi, India - 110001
- Phone: +91 123 456 7890
- WhatsApp: +918269270775 (floating button on bottom right of website)
- Email: info@radianceclinic.com
- Hours: Monday - Saturday, 10:30 AM - 7:00 PM
- Services: Skin Care, Hair Care, Body Care, Dermatology Consultations, Laser Therapy, Acne Treatment

How to book:
1. Go to the "Book Appointment" page from the top navigation.
2. Select a date - green slots are open, grey slots are full or blocked.
3. Click a green slot and fill in your details to confirm.
4. You will also get a confirmation email.

When a user asks to check availability for a specific date or time slot, ALWAYS use the 'check_availability' tool FIRST before responding.
If they ask how to book, guide them to the "Book Appointment" page.
If they ask about services or general info, answer using the key facts above.
`;

const checkAvailabilityDeclaration: FunctionDeclaration = {
  name: "check_availability",
  description: "Check real-time slot availability from the clinic's booking system for a given date and optional time.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: "The appointment date in YYYY-MM-DD format.",
      },
      time: {
        type: SchemaType.STRING,
        description: "Optional: specific time slot like '2:00 PM'. If omitted, all available slots for the date are returned.",
      },
    },
    required: ["date"],
  },
};

let chatSessionInstance: ChatSession | null = null;

export const getChatSession = () => {
  if (!chatSessionInstance) {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      tools: [{ functionDeclarations: [checkAvailabilityDeclaration] }],
    });
    chatSessionInstance = model.startChat({ history: [] });
  }
  return chatSessionInstance;
};

export const sendMessageToGemini = async (message: string) => {
  if (!apiKey) {
    return "The chatbot is not configured. Please contact the clinic directly at +91 123 456 7890.";
  }

  const session = getChatSession();

  try {
    const result = await session.sendMessage(message);
    const call = result.response.functionCalls()?.[0];

    if (call && call.name === "check_availability") {
      const apiResponse = await checkAvailability(call.args as any);
      const secondResult = await session.sendMessage([{
        functionResponse: {
          name: "check_availability",
          response: apiResponse,
        },
      }]);
      return secondResult.response.text();
    }

    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Sorry, I encountered an error. Please try again or contact the clinic directly.`;
  }
};
