import { writeFile } from "fs";
import { JSDOM } from "jsdom";

import { Color, Point, randomColor, randomPoint } from "./utl";

// Create a JSDOM instance
const { window } = new JSDOM(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Headless Canvas</title>
</head>
<body>
  <canvas id="canvas" width="800" height="600"></canvas>
</body>
</html>
`);

// Extract the document and other necessary objects from the JSDOM window
const { document } = window;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Set the canvas background color to white
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

interface Triangle {
  points: Point[];
  color: Color;
}

const triangles = generateRandomTriangles(500);

for (const triangle of triangles) {
  drawTriangle(triangle);
}

saveOutput("canvas_output.png");

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

function saveOutput(fileName: string): void {
  const dataURL = canvas.toDataURL("image/png");
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

  writeFile(fileName, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving the image:", err);
    } else {
      console.log(`Canvas output saved as ${fileName}`);
    }
  });
}
