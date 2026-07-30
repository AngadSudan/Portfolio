import Update from "@/models/Updates";
import connectDB from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const updates = await Update.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Updates fetched successfully",
        data: updates,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching updates:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch updates",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
