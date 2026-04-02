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

  // Verify user is part of this conversation
  const [conv] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation WHERE conversationId = ? AND (user1 = ? OR user2 = ?)",
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
