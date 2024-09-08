import { loadImage } from "canvas";
import { JSDOM } from "jsdom";

import { calculateMSE } from "./fitness.js";
import { appendLog, Color, Point, randomColor, randomPoint, saveOutputImage, saveOutputJSON } from "./util.js";

interface Triangle {
  points: Point[];
  color: Color;
}

interface Individual {
  triangles: Triangle[];
  fitness: number;
}

await appendLog(["Generation", "Fitness", "Mutation rate"], "log.csv");

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

const numberOfTriangles = 500;

// Genetic Algorithm Parameters
const populationSize = 100;
const generations = 200;
const initialMutationRate = 0.3;
const eliteSize = 10;

let mutationRate = initialMutationRate;

let population: Individual[] = generateInitialPopulation(populationSize);

let bestYet: Individual = { triangles: [], fitness: Infinity };

for (let generation = 0; generation < generations; generation++) {
  console.log("\nGeneration", generation + 1);
  // Evaluate Fitness
  population = evaluateFitness(population);

  // Select Best Individuals
  const bestIndividuals = selectBestIndividuals(population, eliteSize);
  const bestInGeneration = bestIndividuals[0];

  if (generation % 10 === 0) {
    drawIndividual(bestInGeneration);
    await saveOutputImage(canvas, `generation_${generation.toString().padStart(4, "0")}.png`);
  }

  console.log("Best Fitness Score", bestInGeneration.fitness);

  // Preserve the best individual from all generations
  if (bestInGeneration.fitness <= bestYet.fitness) {
    bestYet = deepCopy(bestInGeneration);
    drawIndividual(bestYet);
    await saveOutputImage(canvas, "best_yet.png");
    await saveOutputJSON(bestYet, "best_yet.json");
    await appendLog([generation, bestYet.fitness, mutationRate], "log.csv");
    mutationRate *= 0.999; // Decrease mutation rate by 0.1%
    console.log("Reducing mutation rate...", mutationRate);
  }

  // Generate Offspring
  population = generateOffspring([bestYet, ...bestIndividuals], populationSize, mutationRate, eliteSize);
}

function generateInitialPopulation(size: number): Individual[] {
  const population: Individual[] = [];
  for (let i = 0; i < size; i++) {
    const triangles = generateRandomTriangles(numberOfTriangles);
    population.push({ triangles, fitness: Infinity });
  }
  return population;
}

function selectBestIndividuals(population: Individual[], eliteSize: number): Individual[] {
  return population.sort((a, b) => a.fitness - b.fitness).slice(0, eliteSize);
}

function generateOffspring(
  bestIndividuals: Individual[],
  populationSize: number,
  mutationRate: number,
  eliteSize: number
): Individual[] {
  const offspring: Individual[] = [];

  // Preserve the elite individuals
  for (let i = 0; i < eliteSize; i++) {
    offspring.push(bestIndividuals[i]);
  }

  // Generate the rest of the population, leave some room for new individuals
  while (offspring.length < populationSize - 10) {
    const parent1 = bestIndividuals[Math.floor(Math.random() * bestIndividuals.length)];
    const parent2 = bestIndividuals[Math.floor(Math.random() * bestIndividuals.length)];
    const child = crossover(parent1, parent2);
    mutate(child, mutationRate);
    offspring.push(child);
  }

  // Add some brand new ones, they may be better
  while (offspring.length < populationSize) {
    const triangles = generateRandomTriangles(numberOfTriangles);
    offspring.push({ triangles, fitness: Infinity });
  }

  return offspring;
}

function crossover(parent1: Individual, parent2: Individual): Individual {
  const triangles: Triangle[] = [];
  for (let i = 0; i < parent1.triangles.length; i++) {
    if (Math.random() < 0.5) {
      triangles.push(parent1.triangles[i]);
    } else {
      triangles.push(parent2.triangles[i]);
    }
  }
  return { triangles, fitness: Infinity };
}

function mutate(individual: Individual, mutationRate: number): void {
  for (let i = 0; i < individual.triangles.length; i++) {
    if (Math.random() < mutationRate) {
      if (Math.random() < 0.5) {
        // Small perturbations to the existing points and color
        for (const point of individual.triangles[i].points) {
          point.x += Math.floor(Math.random() * 21) - 10; // Adjust x by -10 to 10
          point.y += Math.floor(Math.random() * 21) - 10; // Adjust y by -10 to 10
        }
        individual.triangles[i].color.red = Math.min(
          255,
          Math.max(0, individual.triangles[i].color.red + Math.floor(Math.random() * 21) - 10)
        );
        individual.triangles[i].color.green = Math.min(
          255,
          Math.max(0, individual.triangles[i].color.green + Math.floor(Math.random() * 21) - 10)
        );
        individual.triangles[i].color.blue = Math.min(
          255,
          Math.max(0, individual.triangles[i].color.blue + Math.floor(Math.random() * 21) - 10)
        );
        individual.triangles[i].color.opacity = Math.min(
          1,
          Math.max(0, individual.triangles[i].color.opacity + Math.random() * 0.1 - 0.05)
        );
      } else {
        // Generate a completely new triangle
        individual.triangles[i] = {
          points: [randomPoint(canvas), randomPoint(canvas), randomPoint(canvas)],
          color: randomColor(),
        };
      }
    }
  }
}

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

function evaluateFitness(population: Individual[]): Individual[] {
  return population.map((individual) => {
    drawIndividual(individual);
    individual.fitness = calculateMSE(canvas, referenceCanvas);
    return individual;
  });
}

function drawIndividual(individual: Individual): void {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const triangle of individual.triangles) {
    drawTriangle(triangle);
  }
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

function deepCopy(individual: Individual): Individual {
  return JSON.parse(JSON.stringify(individual));
}
