import { getAIAnalyticsReport } from "@/lib/ai-report-engine";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "1";

    const report = await getAIAnalyticsReport({ forceRefresh: refresh, includeAI: true });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to generate AI analytics report", details: message },
      { status: 500 },
    );
  }
}
