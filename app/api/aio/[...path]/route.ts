import { NextRequest, NextResponse } from "next/server";
import { apiRequireAuth } from "@/lib/auth-helpers";
import { getAIOCredentials } from "@/lib/aio-credentials";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  
  try {
    // Require authentication
    const session = await apiRequireAuth();
    
    // Get user-specific credentials (fallback to env if not configured)
    const credentials = await getAIOCredentials(session.user.email);

    // Reconstruct the full path and query params
    let endpoint = `/${path.join("/")}`;
    
    // Replace :projectId placeholder with actual project ID
    endpoint = endpoint.replace(':projectId', credentials.projectId);
    
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = `${credentials.apiUrl}${endpoint}${searchParams ? `?${searchParams}` : ""}`;

    console.log("Proxying request to:", fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        accept: "application/json",
        Authorization: `AioAuth ${credentials.apiToken}`,
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
    // Handle missing credentials (user needs to configure) - this is expected, not an error
    if (error instanceof Error && (error as any).code === 'NO_CREDENTIALS') {
      console.log('ℹ️ No credentials configured, client will use mock data');
      return NextResponse.json(
        { 
          error: "Configuration required",
          message: "Please configure your AIO credentials in Settings",
          code: "NO_CREDENTIALS"
        },
        { status: 424 } // 424 Failed Dependency
      );
    }
    
    // Log other errors
    console.error("Proxy fetch error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch from AIO API", details: String(error) },
      { status: 500 }
    );
  }
}
