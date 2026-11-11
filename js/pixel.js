// Pixel art escrito como texto: cada carácter de una fila es un píxel y la
// paleta dice de qué color es. El punto '.' es transparente.
//
//   const rows = ['.gg.', 'gggg'];
//   paintSprite(canvas, rows, { g: '#7a9a3a' });

/** Dibuja las filas en un contexto 2D a partir de (x, y), un píxel por carácter. */
export function drawPixels(ctx, rows, palette, x = 0, y = 0) {
  rows.forEach((row, rowIndex) => {
    for (let col = 0; col < row.length; col++) {
      const color = palette[row[col]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + rowIndex, 1, 1);
    }
  });
}

/** Ajusta el canvas al tamaño del dibujo y lo pinta (el CSS lo escala con image-rendering: pixelated). */
export function paintSprite(canvas, rows, palette) {
  canvas.width = Math.max(...rows.map((row) => row.length));
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPixels(ctx, rows, palette);
}
