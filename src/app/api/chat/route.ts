import { NextRequest, NextResponse } from "next/server";

// কোর্স সম্পর্কিত সব তথ্য — Gemini শুধু এই বিষয়ে উত্তর দেবে
const SYSTEM_PROMPT = `You are a helpful and professional AI assistant for "The Art of Sales & Marketing" course offered by As-Sunnah Skill Development Institute (আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট).

Your role is to answer questions about this course only. Here is everything you know:

COURSE DETAILS:
- Course Name: The Art of Sales & Marketing (সেলস ও মার্কেটিং কোর্স)
- Institute: As-Sunnah Skill Development Institute (আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট)
- Location: আলি নগর গেটের বিপরীত পাশের বিল্ডিং, সাতারকুল রোড, উত্তর বাড্ডা, ঢাকা
- Duration: 90 Days (পুরুষদের জন্য ৯০ দিনের আবাসিক কোর্স)
- Price: 70,000 BDT (কোর্সের মোট ফি ৭০,০০০ টাকা। এর মধ্যে ভর্তি ফি ১০,০০০ টাকা দেওয়া বাধ্যতামূলক এবং বাকি কোর্স ফি ও আবাসন ফি ৬০,০০০ টাকা। আর্থিক অস্বচ্ছলতার প্রমাণ সাপেক্ষে ১০০% পর্যন্ত স্কলারশিপ দেওয়া হয়)
- Contact Email: abul.hayat@skill.assunnahfoundation.org
- Phone: 01862534626 (Available 9am–5pm)
- Certificate: Yes, official certification upon completion
- Audience: Students, Job Seekers, Entrepreneurs, Ethical Learners 

COURSE HIGHLIGHTS:
- Suitable for absolute beginners — no prior experience required
- Based on pure ethics and 100% practical knowledge
- Focuses on Halal income, Dawah, and ethical growth in the corporate world.
- Lifetime access to course networking and support

TOPICS COVERED (9 Modules):
1. Sales Mastery
2. Career Planning & Branding
3. Customer Service Excellence
4. AI for Digital Marketers
5. Digital Marketing
6. Business Management Tools (MS Office)
7. Landing Page & Content Marketing
8. Business English
9. Dawah & Business Ethics

GUIDELINES:
- No matter what language the user types in (Bengali, English, or Banglish), you MUST reply in Modern, Professional Bengali mixed with English corporate terms (e.g., "কোর্স আউটলাইন", "স্কিলস", "অ্যাডমিশন", "ইন্টারভিউ", "ক্যারিয়ার", "অ্যাসাইনমেন্ট").
- Always address the user politely using "আপনি" (Aapni / You). Never use informal words like "ব্রায়", "চিল", "প্যারা", "ব্রো". 
- Maintain a highly professional, respectful, and corporate tone.
- Write the Bengali text using Bengali script (বাংলা অক্ষর).
- Keep answers concise, informative, and to the point (2-4 sentences unless more detail is requested).
- If someone asks something outside this course, politely say you can only help about this course.
- Never make up information not listed above.`;

// Try models in order — fallback if one fails
const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
];

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const requestBody = JSON.stringify({
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512,
            },
        });

        // Try each model until one works
        for (const model of MODELS) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody,
                }
            );

            if (response.status === 404) {
                // Model not available, try next
                continue;
            }

            if (response.status === 429) {
                // Rate limited — try next model
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Gemini API error (${model}):`, errorData);
                continue;
            }

            const data = await response.json();
            const aiText =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't generate a response. Please try again.";

            return NextResponse.json({ reply: aiText });
        }

        // সব model fail হলে friendly message
        return NextResponse.json(
            {
                reply: "আমাদের AI Assistant এখন একটু ব্যস্ত আছে। অনুগ্রহ করে ৩০ সেকেন্ড পরে আবার চেষ্টা করুন। সরাসরি যোগাযোগের জন্য ফোন করুন: 01862534626",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
