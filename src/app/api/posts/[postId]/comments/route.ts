import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cm.commentId, cm.content, cm.timestamp, cm.user,
            u.profilePhoto
     FROM comment cm
     LEFT JOIN user u ON u.username = cm.user
     WHERE cm.postId = ?
     ORDER BY cm.timestamp DESC`,
    [postId]
  );

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  await pool.query(
    "INSERT INTO comment (postId, user, content, timestamp) VALUES (?, ?, ?, NOW())",
    [postId, username, content]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await req.json();

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT user FROM comment WHERE commentId = ?",
    [commentId]
  );
  if (existing.length === 0) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (existing[0].user !== username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query("DELETE FROM comment WHERE commentId = ?", [commentId]);
  return NextResponse.json({ success: true });
}
