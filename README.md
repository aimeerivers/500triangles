# 500 triangles

Generate any image using 500 triangles and a genetic algorithm

This is me just playing with genetic algorithms.

## Usage

    npm install
    npm run build

Add an image called `reference.png` into a folder and run this on that folder

    npm run start [folder]

You will see an output image every 10 generations, and a CSV log file so you can track how the fitness is progressing, and how the mutation rate is changing.

## Examples

### Skanderborg lake

| Reference image                                       | Best triangle replica created                            |
| ----------------------------------------------------- | -------------------------------------------------------- |
| ![Skanderborg reference](./skanderborg/reference.png) | ![Skanderborg best solution](./skanderborg/best_yet.png) |

### Non-binary flag

| Reference image                         | Best triangle replica created              |
| --------------------------------------- | ------------------------------------------ |
| ![Enby reference](./enby/reference.png) | ![Enby best solution](./enby/best_yet.png) |

## More details

I have a blog post coming soon.
