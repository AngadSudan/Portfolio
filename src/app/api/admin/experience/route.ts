import Experience from "@/models/Experience";
import { uploadFileToCloudinary, uploadFilesToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

type ExperienceBody = {
  title: string;
  description: string;
  attachments: { url: string; attachment_name: string }[];
  company: string;
  company_icon: string;
  status: "ongoing" | "completed";
  job_type: "inplace" | "remote";
  job_classification: "internship" | "others" | "open-source";
  start_date: string;
  end_date?: string;
  job_contributions: string[];
};

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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await readExperienceRequest(req);

    const createdExperience = await Experience.create(data);

    if (!createdExperience) {
      return NextResponse.json(
        {
          message: "Experience couldn't be registered",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Experience has been registered",
        data: createdExperience,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating experience:", error);

    return NextResponse.json(
      {
        message: "Unable to upload experience",
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
    const data = await readExperienceRequest(req);

    if (!id) {
      return NextResponse.json({ message: "Experience id is required" }, { status: 400 });
    }

    const updatedExperience = await Experience.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedExperience) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Experience has been updated",
        data: updatedExperience,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating experience:", error);

    return NextResponse.json(
      {
        message: "Unable to update experience",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function readExperienceRequest(req: NextRequest): Promise<ExperienceBody> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return req.json();
  }

  const formData = await req.formData();
  const payload = JSON.parse(String(formData.get("payload") || "{}")) as ExperienceBody;
  const companyIcon = formData.get("company_icon");
  const files = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);

  if (companyIcon instanceof File && companyIcon.size > 0) {
    const uploaded = await uploadFileToCloudinary(companyIcon, "portfolio/experience");
    payload.company_icon = uploaded.secure_url;
  }

  if (files.length) {
    const uploadedFiles = await uploadFilesToCloudinary(files, "portfolio/experience");
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
      return NextResponse.json({ message: "Experience id is required" }, { status: 400 });
    }

    const deletedExperience = await Experience.findByIdAndDelete(id);

    if (!deletedExperience) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Experience has been deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting experience:", error);

    return NextResponse.json(
      {
        message: "Unable to delete experience",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
