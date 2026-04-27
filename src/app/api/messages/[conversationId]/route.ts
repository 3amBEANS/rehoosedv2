import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify user is part of this conversation, and pull the listing it's
  // anchored to (if any) in the same trip.
  const [conv] = await pool.query<RowDataPacket[]>(
    `SELECT conv.conversationId, conv.user1, conv.user2, conv.postId,
            p.title       AS postTitle,
            p.description AS postDescription,
            CASE WHEN dp.postId IS NOT NULL THEN 1 ELSE 0 END AS postIsDigital,
            c.deptCode      AS postDeptCode,
            c.courseNumber  AS postCourseNumber,
            c.courseName    AS postCourseName,
            (SELECT pi.imageUrl FROM postImage pi WHERE pi.postId = conv.postId LIMIT 1) AS postThumbnail
     FROM conversation conv
     LEFT JOIN post p ON p.postId = conv.postId
     LEFT JOIN course c ON c.courseId = p.courseId
     LEFT JOIN digitalPost dp ON dp.postId = p.postId
     WHERE conv.conversationId = ? AND (conv.user1 = ? OR conv.user2 = ?)`,
    [conversationId, username, username]
  );
  if (conv.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [messages] = await pool.query<RowDataPacket[]>(
    `SELECT m.messageId, m.senderUser, m.receiverUser, m.content, m.timestamp
     FROM message m
     WHERE m.conversationId = ?
     ORDER BY m.timestamp ASC`,
    [conversationId]
  );

  return NextResponse.json({ conversation: conv[0], messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Verify user is part of this conversation and get receiver
  const [conv] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation WHERE conversationId = ? AND (user1 = ? OR user2 = ?)",
    [conversationId, username, username]
  );
  if (conv.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const receiver =
    conv[0].user1 === username ? conv[0].user2 : conv[0].user1;

  await pool.query(
    "INSERT INTO message (conversationId, senderUser, receiverUser, content, timestamp) VALUES (?, ?, ?, ?, NOW())",
    [conversationId, username, receiver, content]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
