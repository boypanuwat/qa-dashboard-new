import { NextRequest, NextResponse } from "next/server";

// API Configuration from environment variables
const API_URL = process.env.NEXT_PUBLIC_AIO_API_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_AIO_API_TOKEN;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  
  if (!API_URL || !API_TOKEN) {
    return NextResponse.json(
      { error: "API configuration is missing" },
      { status: 500 }
    );
  }

  // Reconstruct the full path and query params
  const endpoint = `/${path.join("/")}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = `${API_URL}${endpoint}${searchParams ? `?${searchParams}` : ""}`;

  console.log("Proxying request to:", fullUrl);

  try {
    const response = await fetch(fullUrl, {
      headers: {
        accept: "application/json",
        Authorization: `AioAuth ${API_TOKEN}`,
      },
      cache: "no-store", // Disable caching for fresh data
    });

    console.log("Proxy response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from AIO API", details: String(error) },
      { status: 500 }
    );
  }
}
