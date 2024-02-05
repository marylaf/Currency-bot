export function getRandomFlower(array) {
  const randomIndex = Math.floor(Math.random() * array.length); // getting random element
  return array[randomIndex];
}

export function shuffleArrayForFlowers(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // getting random array

    [array[i], array[j]] = [array[j], array[i]];
  }

  const chunkSize = 3;
  let chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize)); // converting to a multidimensional array
  }

  return chunkedArray;
}
