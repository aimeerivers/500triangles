import { loadImage } from "canvas";
import { JSDOM } from "jsdom";

import { calculateMSE } from "./fitness.js";
import { calculateAverageColor, Color, Point, randomColor, randomPoint, saveOutput } from "./util.js";

interface Triangle {
  points: Point[];
  color: Color;
}

interface Individual {
  triangles: Triangle[];
  fitness: number;
}

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

const numberOfTriangles = 500;

// Genetic Algorithm Parameters
const populationSize = 100;
const generations = 100;
const initialMutationRate = 0.5;
const eliteSize = 4;

let mutationRate = initialMutationRate;

let population: Individual[] = generateInitialPopulation(populationSize);
let bestYet: Individual = population[0];

for (let generation = 0; generation < generations; generation++) {
  // Evaluate Fitness
  population = evaluateFitness(population);

  // Select Best Individuals
  const bestIndividuals = selectBestIndividuals(population, eliteSize);

  // Preserve the best individual from all generations
  if (bestIndividuals[0].fitness < bestYet.fitness) {
    bestYet = bestIndividuals[0];
    drawIndividual(bestYet);
    await saveOutput(canvas, "best_yet.png");
    mutationRate *= 0.99; // Decrease mutation rate by 1%
    console.log("Reducing mutation rate...", mutationRate);
  }

  // Save the best from generation
  drawIndividual(bestIndividuals[0]);
  await saveOutput(canvas, `best_from_generation_${(generation + 1).toString().padStart(4, "0")}.png`);

  // Log the best fitness score of the current generation
  console.log(`Generation ${generation + 1}: Best Fitness Score = ${bestIndividuals[0].fitness}`);

  // Generate Offspring
  population = generateOffspring(bestIndividuals.concat(bestYet), populationSize, mutationRate);
  console.log("New population size:", population.length);
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

function generateOffspring(bestIndividuals: Individual[], populationSize: number, mutationRate: number): Individual[] {
  const offspring: Individual[] = [];

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
  for (const triangle of individual.triangles) {
    if (Math.random() < mutationRate) {
      // Small perturbations to the existing points and color
      for (const point of triangle.points) {
        point.x += Math.floor(Math.random() * 21) - 10; // Adjust x by -10 to 10
        point.y += Math.floor(Math.random() * 21) - 10; // Adjust y by -10 to 10
      }
      triangle.color.red = Math.min(255, Math.max(0, triangle.color.red + Math.floor(Math.random() * 21) - 10));
      triangle.color.green = Math.min(255, Math.max(0, triangle.color.green + Math.floor(Math.random() * 21) - 10));
      triangle.color.blue = Math.min(255, Math.max(0, triangle.color.blue + Math.floor(Math.random() * 21) - 10));
      triangle.color.opacity = Math.min(0.1, Math.max(0, triangle.color.opacity + Math.random() * 0.1 - 0.05));
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
  ctx.fillStyle = `rgba(${averageColor.red}, ${averageColor.green}, ${averageColor.blue}, ${averageColor.opacity})`;
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
