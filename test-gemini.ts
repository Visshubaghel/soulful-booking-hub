import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyD_i7cTvciXzBSZUCVs9DvB8byGkuuBe_k");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
async function run() {
  try {
    const res = await model.generateContent("hello");
    console.log(res.response.text());
  } catch(e) {
    console.error("ERR:", e);
  }
}
run();
