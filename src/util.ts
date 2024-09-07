import { writeFile } from "fs";

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

export function calculateAverageColor(canvas: HTMLCanvasElement): Color {
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let red = 0,
    green = 0,
    blue = 0,
    alpha = 0;
  const pixelCount = imgData.length / 4;

  for (let i = 0; i < imgData.length; i += 4) {
    red += imgData[i];
    green += imgData[i + 1];
    blue += imgData[i + 2];
    alpha += imgData[i + 3];
  }

  return {
    red: Math.floor(red / pixelCount),
    green: Math.floor(green / pixelCount),
    blue: Math.floor(blue / pixelCount),
    opacity: parseFloat((alpha / pixelCount / 255).toFixed(2)),
  };
}

export async function saveOutput(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const dataURL = canvas.toDataURL("image/png");
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

  return new Promise((resolve, reject) => {
    writeFile(filename, base64Data, "base64", (err) => {
      if (err) {
        console.error("Error saving the image:", err);
        reject(err);
      } else {
        console.log(`Canvas output saved as ${filename}`);
        resolve();
      }
    });
  });
}
