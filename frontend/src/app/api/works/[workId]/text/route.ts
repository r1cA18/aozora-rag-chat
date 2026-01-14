import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URLS } from "@/lib/backend-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;
  const url = `${BACKEND_URLS.works}/${workId}/text`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch work text:", error);
    return NextResponse.json({ error: "Failed to fetch work text" }, { status: 500 });
  }
}
