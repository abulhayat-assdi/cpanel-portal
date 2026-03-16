import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzBSz_U3ej-fVaWLK5aJj8mw88cBxk1Vohx_1v8anE-YGjwyNT8xGbkhN7xhCBCoK-D/exec";

    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Important: Google Apps Script expects stringified JSON in the body
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Proxy API Error" },
      { status: 500 }
    );
  }
}
