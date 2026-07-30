import Update from "@/models/Updates";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

type UpdateBody = {
  name: string;
  description: string;
  attachments: string[];
};

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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await readUpdateRequest(req);

    const createdUpdate = await Update.create(data);

    if (!createdUpdate) {
      return NextResponse.json(
        {
          message: "Update couldn't be registered",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Update has been registered",
        data: createdUpdate,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating update:", error);

    return NextResponse.json(
      {
        message: "Unable to upload update",
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
    const data = await readUpdateRequest(req);

    if (!id) {
      return NextResponse.json({ message: "Update id is required" }, { status: 400 });
    }

    const updatedUpdate = await Update.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedUpdate) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Update has been updated",
        data: updatedUpdate,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating update:", error);

    return NextResponse.json(
      {
        message: "Unable to update update",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function readUpdateRequest(req: NextRequest): Promise<UpdateBody> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return req.json();
  }

  const formData = await req.formData();
  const payload = JSON.parse(String(formData.get("payload") || "{}")) as UpdateBody;
  const files = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length) {
    const uploadedFiles = await uploadFilesToCloudinary(files, "portfolio/updates");
    payload.attachments = [...(payload.attachments || []), ...uploadedFiles.map((file) => file.secure_url)];
  }

  return payload;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Update id is required" }, { status: 400 });
    }

    const deletedUpdate = await Update.findByIdAndDelete(id);

    if (!deletedUpdate) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Update has been deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting update:", error);

    return NextResponse.json(
      {
        message: "Unable to delete update",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
