"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RiLoader4Fill } from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CiImageOn } from "react-icons/ci";
import { FiExternalLink } from "react-icons/fi";
import { format, set } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const ImageFetcher = ({ paperId }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inView, setInView] = useState(false);
  const ref = useRef();

  const fetchImage = useCallback(async () => {
    if (loading || imageUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`https://late-bird-7898.fly.dev/extract-images?url=https://arxiv.org/pdf/${paperId}`);
      if (!res.ok) {
        setError('Failed to load image');
        throw new Error('Failed to load image');
      }
      const data = await res.json();
      const byteArray = new Uint8Array(Object.values(data));
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error(error);
      setError('Failed to load image');
    } finally {
      setLoading(false);
    }
  }, [paperId, loading, imageUrl]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (inView) {
      fetchImage();
    }
  }, [inView, fetchImage]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <Card ref={ref} className="w-full h-48 overflow-hidden">
      <CardContent className="p-0 h-full flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center gap-4">
            <RiLoader4Fill fontSize={25} className="spinner" />
            <CiImageOn fontSize="30px" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-4">
            <p className="text-xs">No Image Found</p>
            <CiImageOn fontSize="30px" />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Paper preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center">
            <CiImageOn fontSize="30px" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60);
  const [expanded, setExpanded] = useState({});
  const [paperDate, setPaperDate] = useState(new Date());
  const [popoverOpen, setPopoverOpen] = useState(false); 
  const [apiLoading, setApiLoading] = useState(false);

  const formatDateForAPI = (date) => {
    return format(date, "yyyy-MM-dd");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setApiLoading(true);
          const formattedDate = formatDateForAPI(paperDate);
          const res = await fetch(`/api/get-paper?date=${formattedDate}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.length < 1) {
          setApiLoading(false);
          setPapers(null);
        } else {
          setPapers(data);
          setApiLoading(false);
        }
        
      } catch (error) {
        setApiLoading(false);
        console.error(error);
      }
    }
    fetchData();
  }, [paperDate]);

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
    <div className="flex flex-col items-center justify-start bg-gray-200 min-h-screen p-10">
      <div className='flex items-center justify-between  !max-w-[900px] min-w-[900px]'>
        <h1 className="w-1/2 text-2xl font-semibold">Papers found ({papers ? papers.length : 0}).</h1>
        <div className='w-1/2 flex items-center justify-end'>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen} disabled={apiLoading}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            onClick={() => setPopoverOpen(!popoverOpen)}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !paperDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {paperDate ? format(paperDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={paperDate}
            onSelect={(date) => {
              if (date) {
                setPaperDate(date);
                setPopoverOpen(false);
              }
            }}
            disabled={(date) => apiLoading || date > new Date() || date < new Date("2007-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
        </div>
        </div>
      <div className="mt-6 flex items-center justify-center flex-col min-h-[400px] max-w-[900px] min-w-[400px] gap-3">

        {/* if paperr is null show a text saying no papers released for today */}
        {papers === null && !apiLoading &&  (
          <div className="flex items-center justify-center flex-col gap-3">
            <h1 className="text-2xl font-semibold">No papers found for selected date.</h1>
            <p className="text-sm">Please check back later or select a new date</p>
          </div>
        )}

        {/* if papers is not null show the papers */}
        {papers && !apiLoading &&  papers.map((paper, index) => (
  <Card key={index} className="mb-4">
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
      <div className="w-1/2">
        <CardTitle className="leading-6">{paper.generatedTitle}</CardTitle>
        <p className="mb-4">{paper.generatedSummary}</p>
      </div>
      <div className="w-1/2">
        {/* Ensure ImageFetcher re-renders by using a unique key */}
        <ImageFetcher key={paper.paperId} paperId={paper.paperId} />
      </div>
    </CardHeader>
    <CardContent>
      {expanded[index] && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Abstract: {paper.paperTitle}</h3>
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
      <Button
        variant="outline"
        size="sm"
        className="ml-4"
        onClick={() => window.open(`https://arxiv.org/pdf/${paper.paperId}`, "_blank")}
      >
        <FiExternalLink className="mr-2 h-4 w-4" />
        Read Paper
      </Button>
    </CardContent>
  </Card>
))}
        {apiLoading && (
          <>
            <RiLoader4Fill fontSize={20} className="spinner" />
            <p className="text-sm mt-2">Huggingface free spaces is super slow. ETA {timer}s</p>
          </>
        )}
      </div>
    </div>
  );
}