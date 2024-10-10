"use client";

import { useState, useEffect } from "react";
import { RiLoader4Fill } from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

// Skeleton loader component for loading state
const Skeleton = () => {
  return (
    <div className="animate-pulse space-y-4 w-full h-full">
      <div className="bg-gray-300 h-8 w-full rounded-md"></div>
    </div>
  );
};

export default function Home() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60);
  const [expanded, setExpanded] = useState({}); // Track expanded papers

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/get-paper", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setPapers(data);
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

  const toggleExpand = (index) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [index]: !prevExpanded[index],
    }));
  };

  return (
    <div className="flex items-center justify-center bg-gray-200 min-h-screen p-10">
      <div className="flex items-center justify-center flex-col min-h-[400px] max-w-[900px] min-w-[400px] gap-3">
        {papers.map((paper, index) => (
          <Card key={index} className="mb-4">
            <CardHeader>
              <CardTitle>{paper.paperTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{paper.generatedSummary}</p>
              {expanded[index] && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h3 className="font-semibold mb-2">Abstract</h3>
                  <p>{paper.paperSummary}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => toggleExpand(index)}
              >
                {expanded[index] ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Abstract
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show Abstract
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
        {loading && (
          <>
            <RiLoader4Fill fontSize={20} className="spinner" />
            <p className="text-sm mt-2">Huggingface free spaces is super slow. ETA {timer}s</p>
          </>
        )}
      </div>
    </div>
  );
}
