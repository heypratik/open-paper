"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RiLoader4Fill } from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CiImageOn } from "react-icons/ci";
import { FiExternalLink } from "react-icons/fi";

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
      if (!res.ok) throw new Error('Failed to fetch image');
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
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="w-1/2 leading-6">{paper.generatedTitle}</CardTitle>
              <div className="w-1/2">
                <ImageFetcher paperId={paper.paperId} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{paper.generatedSummary}</p>
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