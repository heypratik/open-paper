"use client";

import { useEffect, useState } from "react";
import { RiLoader4Fill } from "react-icons/ri";

const Skeleton = () => {
  return (
    <div className="animate-pulse space-y-4 w-full h-full">
      <div className="bg-gray-300 h-8 w-full rounded-md"></div>
    </div>
  );
};

export default function Home() {
  const [papers, setPapers] = useState([
    // Your papers data
  ]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60);
  const [summaries, setSummaries] = useState({});
  const [activeTab, setActiveTab] = useState({}); 

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/test", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const fetchedPapers = data.data[0].value.data;

        // Set the papers data
        setPapers(fetchedPapers);

        const initialActiveTabs = {};
        fetchedPapers.forEach((paper) => {
          const url = paper[2];
          const extractUrl = url.match(/\(([^)]+)\)/)[1];
          const extractID = extractUrl.split("/").pop();
          initialActiveTabs[extractID] = "abstract"; 
        });
        setActiveTab(initialActiveTabs);

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);

  // Create countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setLoading(false);
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function getSummary(url) {
    setLoading(true);
    const extractUrl = url.match(/\(([^)]+)\)/)[1];
    const extractID = extractUrl.split("/").pop();

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

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: `Can you provide a 1 line super short but comprehensive summary of the given text? The summary should cover all the key points and main ideas presented in the original text, while also condensing the information into a concise and easy-to-understand format. Please ensure that the summary includes relevant details and examples that support the main ideas, while avoiding any unnecessary information or repetition. Text: ${paperSummary}`,
            },
          ],
          max_tokens: 100,
        }),
      });

      const aiData = await aiResponse.json();
      const generatedSummary = aiData.choices[0].message.content.trim();

      // Store the summary
      setSummaries((prevSummaries) => ({
        ...prevSummaries,
        [extractID]: { paperSummary, generatedSummary },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Use effect to fetch summaries for each paper once
  useEffect(() => {
    papers.forEach((paper) => {
      const url = paper[2];
      const extractUrl = url.match(/\(([^)]+)\)/)[1];
      const extractID = extractUrl.split("/").pop();
      // Check if the summary is already fetched
      if (!summaries[extractID]) {
        getSummary(url);
      }
    });
  }, [papers]);

  const toggleTab = (paperId, tab) => {
    setActiveTab((prevTabs) => ({
      ...prevTabs,
      [paperId]: tab,
    }));
  };

  return (
    <div className="flex items-center justify-center bg-gray-200 min-h-screen p-10">
      <div className="flex items-center justify-center flex-col bg-white min-h-[400px] max-w-[900px] min-w-[400px] gap-3">
        {papers.map((paper, index) => {
          const extractUrl = paper[2].match(/\(([^)]+)\)/)[1];
          const extractID = extractUrl.split("/").pop();
          const summaryData = summaries[extractID] || {};

          return (
            <div key={index} className="flex flex-col items-center justify-center w-full p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold mb-2">{paper[3]}</h2>
              
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => toggleTab(extractID, "abstract")}
                  className={`px-4 py-2 ${activeTab[extractID] === "abstract" ? "bg-gray-300" : "bg-gray-100"}`}
                >
                  Abstract
                </button>
                <button
                  onClick={() => toggleTab(extractID, "summary")}
                  className={`px-4 py-2 ${activeTab[extractID] === "summary" ? "bg-gray-300" : "bg-gray-100"}`}
                >
                  Generated Summary
                </button>
              </div>

              {/* Abstract Tab */}
              {activeTab[extractID] === "abstract" && (
                <p>{summaryData.paperSummary || "Loading abstract..."}</p>
              )}

              {/* Generated Summary Tab */}
              {activeTab[extractID] === "summary" && (
                <div>
                  {summaryData.generatedSummary ? (
                    <p>{summaryData.generatedSummary}</p>
                  ) : (
                    <Skeleton />
                  )}
                </div>
              )}
            </div>
          );
        })}
        <RiLoader4Fill fontSize={20} className={`spinner ${papers.length === 0 ? 'block' : 'hidden'}`} />
        {papers.length === 0 && <p className="text-sm mt-2">Huggingface free spaces is super slow. ETA {timer}s</p>}
      </div>
    </div>
  );
}
