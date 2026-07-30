import Blog from "@/models/blogs";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

type BlogBody = {
  name: string;
  description: string;
  blocks: {
    blog_type: "paragraph" | "callout" | "image";
    text?: string;
    caption?: string;
    url?: string;
  }[];
};

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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await readBlogRequest(req);

    const dbBlog = await Blog.findOne({ name: data.name });

    if (dbBlog) {
      return NextResponse.json(
        {
          message: "Blog already registered",
        },
        { status: 500 },
      );
    }

    const createdBlog = await Blog.create(data);

    if (!createdBlog) {
      return NextResponse.json(
        {
          message: "Blog couldn't be registered",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Blog has been registered",
        data: createdBlog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating blog:", error);

    return NextResponse.json(
      {
        message: "Unable to upload blog",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get("id");
    const data = await readBlogRequest(req);

    if (!id) {
      return NextResponse.json({ message: "Blog id is required" }, { status: 400 });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Blog has been updated",
        data: updatedBlog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating blog:", error);

    return NextResponse.json(
      {
        message: "Unable to update blog",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function readBlogRequest(req: NextRequest): Promise<BlogBody> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return req.json();
  }

  const formData = await req.formData();
  const payload = JSON.parse(String(formData.get("payload") || "{}")) as BlogBody;
  const files = formData.getAll("blockImages").filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length) {
    const uploadedFiles = await uploadFilesToCloudinary(files, "portfolio/blogs");
    let uploadedIndex = 0;

    payload.blocks = (payload.blocks || []).map((block) => {
      if (block.blog_type !== "image" || block.url || uploadedIndex >= uploadedFiles.length) {
        return block;
      }

      const uploaded = uploadedFiles[uploadedIndex];
      uploadedIndex += 1;
      return { ...block, url: uploaded.secure_url };
    });

    while (uploadedIndex < uploadedFiles.length) {
      payload.blocks.push({
        blog_type: "image",
        caption: files[uploadedIndex].name,
        url: uploadedFiles[uploadedIndex].secure_url,
      });
      uploadedIndex += 1;
    }
  }

  return payload;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Blog id is required" }, { status: 400 });
    }

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Blog has been deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting blog:", error);

    return NextResponse.json(
      {
        message: "Unable to delete blog",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
