import { getUser } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in /api/user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}