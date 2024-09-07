import { loadImage } from "canvas";
import { JSDOM } from "jsdom";

import { calculateMSE } from "./fitness.js";
import { calculateAverageColor, Color, Point, randomColor, randomPoint, saveOutput } from "./util.js";

const { window } = new JSDOM(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Headless Canvas</title>
</head>
<body>
  <canvas id="canvas"></canvas>
  <canvas id="referenceCanvas"></canvas>
</body>
</html>
`);

const { document } = window;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const referenceCanvas = document.getElementById("referenceCanvas") as HTMLCanvasElement;
const referenceCtx = referenceCanvas.getContext("2d")!;

const referenceImage = await loadImage("reference_image.png");
const referenceImageSource = referenceImage as unknown as CanvasImageSource;

canvas.width = referenceImage.width;
canvas.height = referenceImage.height;

referenceCanvas.width = referenceImage.width;
referenceCanvas.height = referenceImage.height;

referenceCtx.drawImage(referenceImageSource, 0, 0, referenceImage.width, referenceImage.height);

const averageColor = calculateAverageColor(referenceCanvas);

ctx.fillStyle = `rgba(${averageColor.red}, ${averageColor.green}, ${averageColor.blue}, ${averageColor.opacity})`;
ctx.fillRect(0, 0, canvas.width, canvas.height);

interface Triangle {
  points: Point[];
  color: Color;
}

const triangles = generateRandomTriangles(500);

for (const triangle of triangles) {
  drawTriangle(triangle);
}

saveOutput(canvas, "canvas_output.png");
const fitnessScore = calculateMSE(canvas, referenceCanvas);
console.log(`Fitness Score: ${fitnessScore}`);

function generateRandomTriangles(count: number): Triangle[] {
  const triangles: Triangle[] = [];

  for (let i = 0; i < count; i++) {
    triangles.push({
      points: [randomPoint(canvas), randomPoint(canvas), randomPoint(canvas)],
      color: randomColor(),
    });
  }

  return triangles;
}

function drawTriangle(triangle: Triangle): void {
  const points = triangle.points;
  const color = triangle.color;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.closePath();

  ctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.opacity})`;
  ctx.fill();
}
