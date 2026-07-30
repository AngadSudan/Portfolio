import Blog from "@/models/blogs";
import connectDB from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const blogs = await Blog.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Blogs fetched successfully",
        data: blogs,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching blogs:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch blogs",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
