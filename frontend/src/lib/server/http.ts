import { NextResponse } from "next/server";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}
