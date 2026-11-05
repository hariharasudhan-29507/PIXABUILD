import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "pixabuild-spatial-zerogpu",
    space: "hariwes/pixabuild-backend"
  });
}
