import { Client } from "@gradio/client";

export async function GET(req, res) {
    const client = await Client.connect("huggingface/paper-central");
    const result = await client.predict("/update_data", { 		
                date: "2024-10-13", 		
                cat_options_list: ["cs.*"], 		
                hf_options_list: [], 		
                conference_options_list: [], 		
                author_search_input: "", 		
                title_search_input: "", 
        });

        console.log(result)

     return new Response(JSON.stringify(result), {
         status: 200,
         headers: {
             'Content-Type': 'application/json',
             'Cache-Control': 'no-store',
         },
     });
 }