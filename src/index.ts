import { loadImage } from "canvas";
import { readdir, readFile } from "fs/promises";
import { JSDOM } from "jsdom";
import path from "path";

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

await appendLog(["Generation", "Fitness", "Best fitness", "Mutation rate"], "log.csv");

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
const generations = 50;
const initialMutationRate = 0.1;
const selectSize = 20;
const eliteSize = 5;

let mutationRate = initialMutationRate;

let bestYet: Individual = { triangles: [], fitness: Infinity };
let bestYetFitness = Infinity;

// let population: Individual[] = generateInitialPopulation(populationSize);
let population: Individual[] = [];

const bestIndividuals = await loadBestIndividualsFromFolders("best");
for (const individual of bestIndividuals) {
  population.push(deepCopy(individual));
}

while (population.length < populationSize) {
  const triangles = generateRandomTriangles(numberOfTriangles);
  population.push({ triangles, fitness: Infinity });
}

// Evolution
for (let generation = 0; generation <= generations; generation++) {
  console.log("\nGeneration", generation);
  // Evaluate Fitness
  population = evaluateFitness(population);

  // Select Best Individuals
  const bestIndividuals = selectBestIndividuals(population, selectSize);
  const bestInGeneration = bestIndividuals[0];

  if (generation % 10 === 0) {
    drawIndividual(bestInGeneration);
    await saveOutputImage(canvas, `generation_${generation.toString().padStart(4, "0")}.png`);
  }

  console.log("Best Fitness Score", bestInGeneration.fitness);

  // Preserve the best individual from all generations
  if (bestInGeneration.fitness < bestYetFitness) {
    bestYet = deepCopy(bestInGeneration);
    bestYetFitness = bestYet.fitness;
    drawIndividual(bestYet);
    await saveOutputImage(canvas, "best_yet.png");
    await saveOutputJSON(bestYet, "best_yet.json");
    mutationRate *= 0.99; // Decrease mutation rate by 1%
    console.log("Reducing mutation rate...", mutationRate);
  } else {
    mutationRate *= 1.01; // Increase mutation rate by 1%
    console.log("Increasing mutation rate...", mutationRate);
  }

  await appendLog([generation, bestInGeneration.fitness, bestYetFitness, mutationRate], "log.csv");

  // Generate Offspring
  population = generateOffspring([bestYet, ...bestIndividuals], populationSize, mutationRate, eliteSize);
}

// function generateInitialPopulation(size: number): Individual[] {
//   const population: Individual[] = [];
//   for (let i = 0; i < size; i++) {
//     const triangles = generateRandomTriangles(numberOfTriangles);
//     population.push({ triangles, fitness: Infinity });
//   }
//   return population;
// }

function selectBestIndividuals(population: Individual[], selectSize: number): Individual[] {
  return population.sort((a, b) => a.fitness - b.fitness).slice(0, selectSize);
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
    offspring.push(deepCopy(bestIndividuals[i]));
  }

  // Generate the rest of the population through crossover and mutation
  while (offspring.length < populationSize) {
    const parent1 = bestIndividuals[Math.floor(Math.random() * bestIndividuals.length)];
    const parent2 = bestIndividuals[Math.floor(Math.random() * bestIndividuals.length)];
    const child = crossover(parent1, parent2);
    mutate(child, mutationRate);
    offspring.push(child);
  }

  return offspring;
}

function crossover(parent1: Individual, parent2: Individual): Individual {
  const triangles: Triangle[] = [];
  const dice = Math.random();
  for (let i = 0; i < parent1.triangles.length; i++) {
    if (dice < 0.5) {
      if (parent1.triangles[i].points[0].x < canvas.width / 2) {
        triangles.push(parent1.triangles[i]);
      } else {
        triangles.push(parent2.triangles[i]);
      }
    } else {
      if (parent1.triangles[i].points[0].x > canvas.width / 2) {
        triangles.push(parent1.triangles[i]);
      } else {
        triangles.push(parent2.triangles[i]);
      }
    }
  }
  return { triangles, fitness: Infinity };
}

function mutate(individual: Individual, mutationRate: number): void {
  for (let i = 0; i < individual.triangles.length; i++) {
    if (Math.random() < mutationRate) {
      const dice = Math.random();
      if (dice < 0.5) {
        // Small perturbations to the existing points and color
        for (const point of individual.triangles[i].points) {
          point.x += Math.floor(Math.random() * 21) - 10; // Adjust x by -10 to 10
          point.y += Math.floor(Math.random() * 21) - 10; // Adjust y by -10 to 10
        }
      } else if (dice < 0.75) {
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

async function loadBestIndividualsFromFolders(folderPath: string): Promise<Individual[]> {
  const subFolders = await readdir(folderPath, { withFileTypes: true });
  const bestIndividuals: Individual[] = [];

  for (const subFolder of subFolders) {
    if (subFolder.isDirectory()) {
      const bestYetPath = path.join(folderPath, subFolder.name, "best_yet.json");
      try {
        const bestYetData = await readFile(bestYetPath, "utf-8");
        const bestIndividual = JSON.parse(bestYetData);
        bestIndividuals.push(bestIndividual);
      } catch (error) {
        console.error(`Error reading ${bestYetPath}:`, error);
      }
    }
  }

  return bestIndividuals;
}
