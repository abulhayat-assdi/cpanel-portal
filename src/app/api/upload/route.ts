import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "images/instructors";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the upload directory
    // If routines, we use public/documents/routines
    // Else use the provided path under public/
    let uploadSubDir = folder;
    if (folder === "routines") {
      uploadSubDir = "documents/routines";
    }

    const uploadDir = path.join(process.cwd(), "public", uploadSubDir);
    
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename: timestamp-sanitized-name
    const cleanFileName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    const uniqueFilename = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save the file
    await writeFile(filePath, buffer);

    // Return the public URL path
    const url = `/${uploadSubDir}/${uniqueFilename}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
