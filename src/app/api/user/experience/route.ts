import Experience from "@/models/Experience";
import connectDB from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const experiences = await Experience.find({}).sort({ start_date: -1 });

    return NextResponse.json(
      {
        message: "Experience fetched successfully",
        data: experiences,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching experience:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch experience",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
