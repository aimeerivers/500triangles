import { writeFile } from "fs";
import { JSDOM } from "jsdom";

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
  x: number;
  y: number;
  size: number;
  red: number;
  green: number;
  blue: number;
  opacity: number;
}

const triangles = generateRandomTriangles(500);

for (const triangle of triangles) {
  drawTriangle(triangle.x, triangle.y, triangle.size, triangle.red, triangle.green, triangle.blue, triangle.opacity);
}

saveOutput("canvas_output.png");

function generateRandomTriangles(count: number): Triangle[] {
  const triangles: Triangle[] = [];

  for (let i = 0; i < count; i++) {
    triangles.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      size: Math.floor(Math.random() * 200),
      red: Math.floor(Math.random() * 256),
      green: Math.floor(Math.random() * 256),
      blue: Math.floor(Math.random() * 256),
      opacity: parseFloat((Math.random() * 0.5).toFixed(2)),
    });
  }

  return triangles;
}

function drawTriangle(
  x: number,
  y: number,
  size: number,
  red: number,
  green: number,
  blue: number,
  opacity: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size / 2, y - size);
  ctx.closePath();

  // Set fill color with opacity

  ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${opacity})`;
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
