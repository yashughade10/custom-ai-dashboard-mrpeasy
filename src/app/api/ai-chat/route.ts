import { answerAnalyticsQuestion } from "@/lib/ai-report-engine";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 });
    }

    const response = await answerAnalyticsQuestion(question);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to answer analytics question", details: message },
      { status: 500 },
    );
  }
}
