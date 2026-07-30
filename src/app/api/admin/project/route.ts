import Project from "@/models/Projects";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/utils/db";
import { ProjectBody } from "@/utils/type";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Projects fetched successfully",
        data: projects,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching projects:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch projects",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await readProjectRequest(req);

    const dbProject = await Project.findOne({
      github_link: data.github_link,
    });

    if (dbProject)
      return NextResponse.json(
        {
          message: "Project already registered",
        },
        { status: 500 },
      );

    const createdProject = await Project.create({
      ...data,
    });

    if (!createdProject)
      return NextResponse.json(
        {
          message: "Project couldn't be registered",
        },
        { status: 500 },
      );

    return NextResponse.json(
      {
        message: "Project has been registered",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching projects:", error);

    return NextResponse.json(
      {
        message: "Unable to upload projects",
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
    const data = await readProjectRequest(req);

    if (!id) {
      return NextResponse.json({ message: "Project id is required" }, { status: 400 });
    }

    const updatedProject = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Project has been updated",
        data: updatedProject,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating project:", error);

    return NextResponse.json(
      {
        message: "Unable to update project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function readProjectRequest(req: NextRequest): Promise<ProjectBody> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return req.json();
  }

  const formData = await req.formData();
  const payload = JSON.parse(String(formData.get("payload") || "{}")) as ProjectBody;
  const thumbnail = formData.get("thumbnail");

  if (thumbnail instanceof File && thumbnail.size > 0) {
    const uploaded = await uploadFileToCloudinary(thumbnail, "portfolio/projects");
    payload.thumbnail = uploaded.secure_url;
  }

  return payload;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Project id is required" }, { status: 400 });
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Project has been deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting project:", error);

    return NextResponse.json(
      {
        message: "Unable to delete project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
