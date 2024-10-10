import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import fetch from "node-fetch"; // Import node-fetch to fetch the PDF

// Function to fetch PDF from the URL
async function fetchPDF(pdfUrl) {
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  return buffer;
}

// Function to extract images (objects) from PDF
async function extractImagesFromPDF(pdfUrl) {
  const pdfBuffer = await fetchPDF(pdfUrl);

  // Parse the PDF using pdf-parse
  const data = await pdfParse(pdfBuffer);

  // Extract images from the parsed PDF (this example uses inline image object parsing)
  const imageUrls = [];

  // Loop through the pages and content to extract images
  // This is a placeholder; you will need to adjust depending on the actual image extraction method
  // pdf-parse doesn't natively support direct image extraction, so custom logic is required here.
  
  // In this demo, we focus on metadata or images if they are extracted.
  if (data.metadata) {
    console.log('PDF Metadata:', data.metadata);
  }

  // Extracted image placeholder for demo purposes
  // In real use, you'll write custom logic to process images from PDF objects.
  imageUrls.push("data:image/jpeg;base64,EXAMPLE_BASE64_STRING");

  return imageUrls;
}

// Next.js API route to handle the request
export async function GET(req) {
    console.log("GET request received");
  try {
    const { searchParams } = new URL(req.url);
    const pdfUrl = searchParams.get("pdfUrl");

    if (!pdfUrl) {
      return NextResponse.json({ error: "PDF URL is required" }, { status: 400 });
    }

    // Extract images from the PDF
    const imageUrls = await extractImagesFromPDF(pdfUrl);

    return NextResponse.json(imageUrls, { status: 200 });
  } catch (error) {
    console.error("Error extracting images from PDF:", error);
    return NextResponse.json({ error: "Failed to extract images from PDF" }, { status: 500 });
  }
}
