"use client";

import { askAnalyticsQuestion } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MessageSquareText, SendHorizonal, X, Maximize2, Minimize2 } from "lucide-react";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  highlights?: string[];
  charts?: string[];
  drilldowns?: string[];
};

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  text: "Ask me questions like: revenue last week, fastest products, delayed orders today, or stockout predictions.",
};

export default function AIAnalyticsChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: askAnalyticsQuestion,
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
          highlights: response.highlights,
          charts: response.suggestedCharts,
          drilldowns: response.suggestedDrilldowns,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not process that right now. Please try again in a moment.",
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mutation.isPending]);

  const canSend = useMemo(() => input.trim().length > 0 && !mutation.isPending, [input, mutation.isPending]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || mutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    mutation.mutate(question);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <Card className={`pointer-events-auto flex flex-col shadow-xl transition-all duration-300 ease-in-out ${isExpanded ? 'h-[80vh] w-[min(700px,calc(100vw-2.5rem))]' : 'h-[560px] w-[min(420px,calc(100vw-2.5rem))]'}`}>
          <CardHeader className="space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Vaccy AI</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chatbot"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Ask natural-language questions and get KPI answers with chart and drill-down suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted text-foreground"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.highlights && message.highlights.length > 0 ? (
                    <div className="mt-2 space-y-1 text-xs">
                      {message.highlights.map((line) => (
                        <div key={line}>- {line}</div>
                      ))}
                    </div>
                  ) : null}

                  {message.charts && message.charts.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.charts.map((chart) => (
                        <Badge key={chart} variant="secondary" className="text-[10px] break-words whitespace-normal text-left max-w-full">
                          Chart: {chart}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {message.drilldowns && message.drilldowns.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.drilldowns.map((drilldown) => (
                        <Badge key={drilldown} variant="outline" className="text-[10px] break-words whitespace-normal text-left max-w-full">
                          Drill-down: {drilldown}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {mutation.isPending ? (
                <div className="mr-auto inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2 shrink-0">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="What was our revenue last week?"
              />
              <Button type="submit" disabled={!canSend}>
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button className="pointer-events-auto shadow-lg cursor-pointer" size="lg" onClick={() => setIsOpen(true)}>
          <MessageSquareText className="h-4 w-4" />
          Vaccy AI
        </Button>
      )}
    </div>
  );
}
