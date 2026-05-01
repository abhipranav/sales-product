import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import { invalidateSystemReadiness } from "@/lib/services/system-readiness";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    
    // Execute seeding command safely
    // Since we're using SQLite, we run node prisma/seed.mjs
    const { stdout, stderr } = await execAsync("node prisma/seed.mjs");
    console.log("Database seeding completed:", stdout);
    if (stderr) {
      console.warn("Database seeding warnings:", stderr);
    }
    
    // Invalidate readiness cache so stats are fully recalculated
    invalidateSystemReadiness(actor);
    
    return NextResponse.json({ success: true, message: "Database wiped and seeded successfully." });
  } catch (error: any) {
    console.error("Database seeding failed", error);
    return NextResponse.json(
      { error: error?.message || "Database seeding failed. Please check logs." },
      { status: 500 }
    );
  }
}
