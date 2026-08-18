import { NextRequest, NextResponse } from "next/server";
import { importDataset, importJSON } from "@/lib/services/import";
import { getImportStats } from "@/lib/services/settings";

export async function GET() {
  try {
    const stats = await getImportStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load import stats" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const datasetType = formData.get("datasetType") as string;
    const format = formData.get("format") as string ?? "csv";

    if (!file || !datasetType) {
      return NextResponse.json({ error: "File and dataset type required" }, { status: 400 });
    }

    const content = await file.text();
    const result =
      format === "json"
        ? await importJSON(content, datasetType, file.name)
        : await importDataset(content, datasetType, file.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
