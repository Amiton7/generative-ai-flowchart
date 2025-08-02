// src/utils/stripLayout.js

export function getStripLayout(USE_CASES, height) {
  const stripHeight = height / USE_CASES.length;
  return USE_CASES.map((useCase, i) => ({
    useCase,
    top: i * stripHeight,
    bottom: (i + 1) * stripHeight,
    center: i * stripHeight + stripHeight / 2,
    height: stripHeight,
    index: i,
  }));
}
