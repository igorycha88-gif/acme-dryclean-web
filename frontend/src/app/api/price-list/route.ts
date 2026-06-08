import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const PDF_PATH = path.join(process.cwd(), "public", "price-list.pdf");

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  console.log(`[${requestId}] [PRICE-LIST] Запрос PDF от ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`);
  console.log(`[${requestId}] [PRICE-LIST] User-Agent: ${request.headers.get("user-agent")}`);
  console.log(`[${requestId}] [PRICE-LIST] Ожидаемый путь файла: ${PDF_PATH}`);
  console.log(`[${requestId}] [PRICE-LIST] CWD: ${process.cwd()}`);

  try {
    const fileStat = await stat(PDF_PATH);
    console.log(`[${requestId}] [PRICE-LIST] Файл найден. Размер: ${fileStat.size} байт (${(fileStat.size / 1024 / 1024).toFixed(2)} MB)`);

    if (fileStat.size === 0) {
      console.error(`[${requestId}] [PRICE-LIST] Файл пуст!`);
      return new NextResponse("PDF file is empty", { status: 500 });
    }

    const buffer = await readFile(PDF_PATH);
    console.log(`[${requestId}] [PRICE-LIST] Файл прочитан. Буфер: ${buffer.byteLength} байт`);

    const headerBytes = Buffer.from(buffer.subarray(0, 8)).toString("ascii");
    console.log(`[${requestId}] [PRICE-LIST] Первые 8 байт (сигнатура): "${headerBytes}"`);

    if (!headerBytes.startsWith("%PDF")) {
      console.error(`[${requestId}] [PRICE-LIST] НЕВЕРНАЯ СИГНАТУРА! Ожидалось %PDF, получено: "${headerBytes}"`);
      return new NextResponse("File is not a valid PDF", { status: 500 });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] [PRICE-LIST] Отдача PDF. Content-Type: application/pdf. Время: ${elapsed}ms`);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": 'attachment; filename="price-list.pdf"; filename*=UTF-8\'\'%D0%9F%D1%80%D0%B0%D0%B9%D1%81-%D0%BB%D0%B8%D1%81%D1%82-DryClean-Pro.pdf',
        "Cache-Control": "public, max-age=3600",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as NodeJS.ErrnoException)?.code;

    console.error(`[${requestId}] [PRICE-LIST] ОШИБКА (${elapsed}ms): ${errorMessage}`);
    console.error(`[${requestId}] [PRICE-LIST] Код ошибки: ${errorCode}`);

    if (errorCode === "ENOENT") {
      console.error(`[${requestId}] [PRICE-LIST] Файл НЕ НАЙДЕН по пути: ${PDF_PATH}`);

      try {
        const { readdir } = await import("fs/promises");
        const publicDir = path.join(process.cwd(), "public");
        const files = await readdir(publicDir);
        console.error(`[${requestId}] [PRICE-LIST] Содержимое public/: ${files.join(", ")}`);
      } catch {
        console.error(`[${requestId}] [PRICE-LIST] Не удалось прочитать директорию public/`);
      }
    }

    if (errorCode === "EACCES") {
      console.error(`[${requestId}] [PRICE-LIST] НЕТ ДОСТУПА к файлу: ${PDF_PATH}`);
    }

    return new NextResponse(`Failed to load PDF: ${errorMessage}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
