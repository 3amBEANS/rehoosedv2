import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET() {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ user: null });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT username, email, joinDate, profilePhoto FROM user WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: rows[0] });
}
