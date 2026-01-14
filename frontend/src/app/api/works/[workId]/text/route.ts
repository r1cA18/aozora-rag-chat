import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_WORKS_URL || "http://localhost:8000/api/works";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;
  const url = `${BACKEND_BASE_URL}/${workId}/text`;

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
