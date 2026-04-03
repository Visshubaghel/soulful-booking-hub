import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";

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

const systemInstruction = `
You are the friendly and helpful live assistant for Vishwas Skin Clinic.
Your name is "Vishwas Assistant".
You help patients: check appointment availability, learn about services, understand how to book, and answer general questions.
Keep answers friendly, empathetic, professional, and concise. Do NOT write long essays.

Key facts about the clinic:
- Name: Vishwas Skin Clinic
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "API Key is not configured." });
  }

  const { messages = [], message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const history = messages
    .filter((m: any) => m.sender === 'user' || m.sender === 'bot')
    .map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    tools: [{ functionDeclarations: [checkAvailabilityDeclaration] }],
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const call = result.response.functionCalls()?.[0];

    if (call && call.name === "check_availability") {
      const args = call.args as any;
      const host = req.headers.host || "localhost:3000";
      // If we're on localhost, protocol is http, on Vercel it's https
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      
      const fetchUrl = `${protocol}://${host}/api/slots/available?date=${args.date}`;
      let apiResponse;
      
      try {
        const slotsRes = await fetch(fetchUrl);
        if (slotsRes.ok) {
          const data = await slotsRes.json();
          const availableSlots: any[] = data.availableSlots || [];
          
          if (!args.time) {
            if (availableSlots.length === 0) {
              apiResponse = { available: false, message: `Sorry, there are no available slots on ${args.date}. All slots are either blocked or fully booked.` };
            } else {
              const list = availableSlots.map((s) => `${s.time} (${s.spotsLeft} spots left)`).join(", ");
              apiResponse = { available: true, message: `On ${args.date}, the following slots are available: ${list}. Please visit the 'Book Appointment' page to book one.` };
            }
          } else {
            const match = availableSlots.find((s) => s.time.toLowerCase() === args.time.toLowerCase());
            if (match) {
              apiResponse = { available: true, message: `Yes! The ${args.time} slot on ${args.date} is available with ${match.spotsLeft} spot(s) left.` };
            } else {
              apiResponse = { available: false, message: `Sorry, the ${args.time} slot on ${args.date} is not available.` };
            }
          }
        } else {
            apiResponse = { available: false, message: "Could not fetch slots at this time" };
        }
      } catch (err) {
        console.error("Fetch DB error inside tool:", err);
        apiResponse = { available: false, message: "Unable to check availability internally." };
      }

      const secondResult = await chat.sendMessage([{
        functionResponse: {
          name: "check_availability",
          response: apiResponse,
        },
      }]);
      
      return res.status(200).json({ reply: secondResult.response.text(), newHistory: await chat.getHistory() });
    }

    return res.status(200).json({ reply: result.response.text(), newHistory: await chat.getHistory() });

  } catch (error: any) {
    console.error("Gemini Backend error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error connecting to Gemini." });
  }
}
