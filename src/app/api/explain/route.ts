import { NextRequest, NextResponse } from "next/server";
import { explanationEngine } from "@/lib/explanations/explanation-engine";

export async function POST(req: NextRequest) {
  try {
    const context = await req.json();
    const result = explanationEngine.explain(context);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
