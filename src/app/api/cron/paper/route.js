// pages/api/cron.js
import { Client } from "@gradio/client";
import Paper from "../../../../../models/Paper";
import sequelize from "../../../../lib/db"; 
const { Op } = require('sequelize');

export async function GET() {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
  console.log(`Running cron job for date: ${today}`);

  try {
    const client = await Client.connect("huggingface/paper-central");
    const result = await client.predict("/update_data", {
      date: "2024-10-14",
      cat_options_list: ["cs.*"],
      hf_options_list: [],
      conference_options_list: [],
      author_search_input: "",
      title_search_input: "",
    });

    const fetchedPapers = result.data[0].value.data;
    let idsToScrape = [];

    fetchedPapers.forEach((paper) => {
      const url = paper[2];
      if (url) {
        const extractUrl = url.match(/\(([^)]+)\)/)[1];
        const extractID = extractUrl.split("/").pop();
        idsToScrape.push(extractID);
      }
    });

    console.log(idsToScrape, "YE SCRAPE KARNA H")

    // Check for existing papers in the database
const existingPapers = await Paper.findAll({
    where: {
      pdfId: {
        [Op.in]: idsToScrape, // Use Op.in to check if pdfId is in the array
      },
    },
    attributes: ['pdfId'],
  });

    const existingIds = existingPapers.map(paper => paper.pdfId);
    const newIdsToScrape = idsToScrape.filter(id => !existingIds.includes(id));
    const idsToProcess = isDevelopment ? newIdsToScrape.slice(0, 1) : newIdsToScrape;
    console.log(`Processing ${idsToProcess}`);

    // Only proceed with new IDs
    if (idsToProcess.length > 0) {
      let fetchTasks = newIdsToScrape.map(async (extractID) => {
        try {
          const res = await fetch(`https://huggingface.co/api/papers/${extractID}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const data = await res.json();
          const paperSummary = data.summary;
          const paperTitle = data.title;
          const paperId = data.id;
          const pdfUrl = `https://arxiv.org/pdf/${data.id}`
          // console.log(`Processing paper ID ${extractID}, title: ${paperTitle}, summary: ${paperSummary  ? true : false}, pdfUrl: ${pdfUrl}, pdfId: ${paperId}`);

          // Call OpenAI for summaries and titles
          const [aiResponse, aiResponseTitle] = await Promise.all([
            fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini-2024-07-18",
                messages: [
                  {
                    role: "user",
                    content: `Create a 1 line summary of this. The summary should be no more than 20 WORDS MAXIMUM- Text: ${paperSummary}`,
                  },
                ],
                max_tokens: 100,
              }),
            }),
            fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini-2024-07-18",
                messages: [
                  {
                    role: "user",
                    content: `This is a title of a research paper. Convert this title into a super short title no more than 5 words while keeping it accurate. Text: ${paperTitle}`,
                  },
                ],
                max_tokens: 100,
              }),
            }),
          ]);

          const aiData = await aiResponse.json();
          const aiDataTitle = await aiResponseTitle.json();
          const generatedSummary = aiData.choices[0].message.content.trim();
          const generatedTitle = aiDataTitle.choices[0].message.content.trim();

          // Insert new paper into the database
          const createdPapers = await Paper.create({
            title: generatedTitle,
            description: generatedSummary, // Adjust based on your model
            authors: [], // Add authors if available
            abstractTitle: paperTitle, // Set if available
            abstract: paperSummary, // Set if available
            pdfUrl: pdfUrl, // Adjust based on your model
            pdfId: paperId,
            // paperDate: new Date(), // Set the correct date
            paperDate: "2024-10-14 04:52:16.687+00",
          });
          return { paperSummary, generatedSummary, generatedTitle, paperTitle, paperId };
        } catch (error) {
          console.error(`Error processing paper ID ${extractID}`, error);
          
          return null;
        }
      });

      // Await all promises to resolve in parallel
      await Promise.all(fetchTasks);
    }

    return new Response(JSON.stringify({ message: "Cron job completed" }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
