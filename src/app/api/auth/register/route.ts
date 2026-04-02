import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, createToken, getTokenCookieOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "Username, email, and password are required" },
      { status: 400 }
    );
  }

  if (username.length > 20) {
    return NextResponse.json(
      { error: "Username must be 20 characters or less" },
      { status: 400 }
    );
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT username FROM user WHERE username = ? OR email = ?",
    [username, email]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Username or email already taken" },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);

  await pool.query(
    "INSERT INTO user (username, password, email, joinDate) VALUES (?, ?, ?, NOW())",
    [username, hashedPassword, email]
  );

  const token = await createToken(username);
  const response = NextResponse.json({ username, email }, { status: 201 });
  response.cookies.set(getTokenCookieOptions(token));
  return response;
}
