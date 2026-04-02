import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `like` WHERE user = ? AND postId = ?",
    [username, postId]
  );

  if (existing.length > 0) {
    // Unlike
    await pool.query("DELETE FROM `like` WHERE user = ? AND postId = ?", [
      username,
      postId,
    ]);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await pool.query(
      "INSERT INTO `like` (user, postId, timestamp) VALUES (?, ?, NOW())",
      [username, postId]
    );
    return NextResponse.json({ liked: true });
  }
}
