import { Client } from "@gradio/client";

export async function GET(req, res) {
    const client = await Client.connect("huggingface/paper-central");
    const result = await client.predict("/update_data_2", { 		
                date: "2024-10-09", 		
                cat_options_list: ["cs.*"], 		
                hf_options_list: [], 		
                conference_options_list: [], 		
                author_search_input: "", 		
                title_search_input: "", 
        });

    const fetchedPapers = result.data[0].value.data;
    let idsToScarpe = [];

    fetchedPapers.forEach((paper) => {
        const url = paper[2];
        if (url) {
          const extractUrl = url.match(/\(([^)]+)\)/)[1];
        const extractID = extractUrl.split("/").pop();
        idsToScarpe.push(extractID);
        }
      });

      let returnResult = []

      for (let extractID of idsToScarpe) {
        try {
            // Fetch the paper summary from Huggingface
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
      
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                    content: `Create a 1 line summary of this. The summary should be no more than 20 WORDS MAXIMUM- 
? The summary should the key points and main ideas presented in the original text. But should be no more than 20 words. Text: ${paperSummary}`,
                  },
                ],
                max_tokens: 100,
              }),
            });

            const aiData = await aiResponse.json();
            const generatedSummary = aiData.choices[0].message.content.trim();

            const aiResponseTitle = await fetch("https://api.openai.com/v1/chat/completions", {
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
            });
      
            const aiDataTitle = await aiResponseTitle.json();
            const generatedTitle = aiDataTitle.choices[0].message.content.trim();

            returnResult.push({ paperSummary, generatedSummary, generatedTitle,  paperTitle, paperId });

          } catch (error) {
            console.error(error);
          } finally {
          }
      }

     return new Response(JSON.stringify(returnResult), {
         status: 200,
         headers: {
             'Content-Type': 'application/json',
             'Cache-Control': 'no-store',
         },
     });
 }