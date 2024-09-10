import { appendFile, writeFile } from "fs/promises";

export type Color = {
  red: number;
  green: number;
  blue: number;
  opacity: number;
};

export type Point = {
  x: number;
  y: number;
};

export function randomPoint(canvas: HTMLCanvasElement): Point {
  return {
    x: Math.floor(Math.random() * (canvas.width + 100)) - 50,
    y: Math.floor(Math.random() * (canvas.height + 100)) - 50,
  };
}

export function randomColor(): Color {
  return {
    red: Math.floor(Math.random() * 256),
    green: Math.floor(Math.random() * 256),
    blue: Math.floor(Math.random() * 256),
    opacity: parseFloat((Math.random() * 0.1).toFixed(3)),
  };
}

export async function saveOutputImage(canvas: HTMLCanvasElement, folder: string, filename: string): Promise<void> {
  const dataURL = canvas.toDataURL("image/png");
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

  await writeFile(`${folder}/${filename}`, base64Data, "base64");
}

export async function saveOutputJSON(data: unknown, folder: string, filename: string): Promise<void> {
  await writeFile(`${folder}/${filename}`, JSON.stringify(data, null, 2));
}

export async function appendLog(data: any[], folder: string, filename: string): Promise<void> {
  const logLine = data.join(",") + "\n";
  await appendFile(`${folder}/${filename}`, logLine);
}

export async function startLog(data: any[], folder: string, filename: string): Promise<void> {
  const logLine = data.join(",") + "\n";
  await writeFile(`${folder}/${filename}`, logLine);
}
