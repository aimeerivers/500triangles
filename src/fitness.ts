export function calculateMSE(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): number {
  const ctx1 = canvas1.getContext("2d")!;
  const ctx2 = canvas2.getContext("2d")!;

  const imgData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data;
  const imgData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data;

  let mse = 0;
  for (let i = 0; i < imgData1.length; i++) {
    const diff = imgData1[i] - imgData2[i];
    mse += diff * diff;
  }

  return mse / imgData1.length;
}
