import { Client } from "@gradio/client";

export async function GET(req, res) {
  const { searchParams } = new URL(req.url);
  const paperDate = searchParams.get('date');

  try {
    const client = await Client.connect("huggingface/paper-central");
    const result = await client.predict("/update_data", {
      date: paperDate,
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

    // Map through all ids and fetch paper data in parallel
    let fetchTasks = idsToScrape.map(async (extractID) => {
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

        // Parallelize OpenAI requests
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

        return { paperSummary, generatedSummary, generatedTitle, paperTitle, paperId };
      } catch (error) {
        console.error(`Error processing paper ID ${extractID}:`, error);
        return null;
      }
    });

    // Await all promises to resolve in parallel
    const returnResult = await Promise.all(fetchTasks);

    // Filter out null results (in case of any errors)
    const filteredResults = returnResult.filter(result => result !== null);

    return new Response(JSON.stringify(filteredResults), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
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
