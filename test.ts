function convert(s: string, numRows: number): string {
  if (numRows < 2) {
    return s;
  }
  let arr: string[][] = [];
  let index = 0;
  const zigZagLength = numRows - 1;

  for (let col = 0; index < s.length; col++) {
    for (let row = 0; row < numRows; row++) {
      const isDown = col % zigZagLength === 0;
      const isZigZag = col % zigZagLength === zigZagLength - (row % zigZagLength);

      arr[row] = arr[row] ?? [];
      arr[row][col] = isDown ? s[index++] : isZigZag ? s[index++] : '';
    }
  }

  return arr.map((row) => row.join('')).join('');
}

console.log(convert('A', 1));
