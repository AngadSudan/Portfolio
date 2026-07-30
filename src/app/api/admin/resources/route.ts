import Resource from "@/models/Resources";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/utils/db";
import { ResourceBody } from "@/utils/type";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const resources = await Resource.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Resources fetched successfully",
        data: resources,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching resources:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch resources",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await readResourceRequest(req);

    const dbResource = await Resource.findOne({
      title: data.title,
    });

    if (dbResource)
      return NextResponse.json(
        {
          message: "Resource already registered",
        },
        { status: 500 },
      );

    const createdResource = await Resource.create({
      ...data,
    });

    if (!createdResource)
      return NextResponse.json(
        {
          message: "Resource couldn't be registered",
        },
        { status: 500 },
      );

    return NextResponse.json(
      {
        message: "Resource has been registered",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching Resources:", error);

    return NextResponse.json(
      {
        message: "Unable to upload Resources",
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
    const data = await readResourceRequest(req);

    if (!id) {
      return NextResponse.json({ message: "Resource id is required" }, { status: 400 });
    }

    const updatedResource = await Resource.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedResource) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Resource has been updated",
        data: updatedResource,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating resource:", error);

    return NextResponse.json(
      {
        message: "Unable to update resource",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function readResourceRequest(req: NextRequest): Promise<ResourceBody> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return req.json();
  }

  const formData = await req.formData();
  const payload = JSON.parse(String(formData.get("payload") || "{}")) as ResourceBody;
  const files = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length) {
    const uploadedFiles = await uploadFilesToCloudinary(files, "portfolio/resources");
    payload.attachments = [
      ...(payload.attachments || []),
      ...uploadedFiles.map((file, index) => ({
        attachment_name: files[index].name,
        url: file.secure_url,
      })),
    ];
  }

  return payload;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Resource id is required" }, { status: 400 });
    }

    const deletedResource = await Resource.findByIdAndDelete(id);

    if (!deletedResource) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Resource has been deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting resource:", error);

    return NextResponse.json(
      {
        message: "Unable to delete resource",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
