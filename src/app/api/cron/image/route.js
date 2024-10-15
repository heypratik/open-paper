// pages/api/cron-image.js
import Paper from "../../../../../models/Paper";
import sequelize from "../../../../lib/db"; 
const { Op } = require('sequelize');

export async function GET() {
  try {
    console.log(`Starting sequential image processing cron job...`);
    // Fetch papers where imageProcessed is false
    const unprocessedPapers = await Paper.findAll({
      where: {
        imageProcessed: false, // Only fetch papers that have not processed images
      },
      attributes: ['id', 'pdfId'],
    });

    if (unprocessedPapers.length === 0) {
      console.log("No papers left to process.");
      return new Response(JSON.stringify({ message: "No papers left to process" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${unprocessedPapers.length} unprocessed papers`);

    // Loop through each paper and process its images one by one
    for (const paper of unprocessedPapers) {
      const { pdfId, id } = paper;

      try {
        // Ping the API to process images
        const res = await fetch(`https://late-bird-7898.fly.dev/extract-images?url=https://arxiv.org/pdf/${pdfId}`);

        if (res.ok) {
          // If the image is processed successfully, update the imageProcessed field to true
          await Paper.update({ imageProcessed: true }, { where: { id } });
          console.log(`Successfully processed images for paper ID: ${pdfId}`);
        } else {
          console.log(`Failed to process images for paper ID: ${pdfId}`);
        }
      } catch (error) {
        console.error(`Error processing paper ID ${pdfId}:`, error);
      }
    }

    console.log("Sequential image processing cron job completed.");
    return new Response(JSON.stringify({ message: "Sequential image processing cron job completed" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing images:', error);
    return new Response(JSON.stringify({ error: 'Error processing images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
