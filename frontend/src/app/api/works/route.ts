import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URLS } from "@/lib/backend-config";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = new URL(BACKEND_URLS.works);

  // Forward all query params
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch works:", error);
    return NextResponse.json({ error: "Failed to fetch works" }, { status: 500 });
  }
}
