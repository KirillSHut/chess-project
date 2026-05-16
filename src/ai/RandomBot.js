export class RandomBot {
  getMove(chessEngine, side) {
    const legalMoves = [];

    chessEngine.cells.forEach((cell) => {
      if (!cell.figure || cell.figure.side !== side) return;

      const legalTargets = chessEngine.getAvailableMoves(
        {
          figureName: cell.figure.name,
          side,
          cellView: { id: cell.id },
        },
        side,
      );

      legalTargets.forEach((target) => {
        legalMoves.push({
          fromId: cell.id,
          toId: target.id,
        });
      });
    });

    if (legalMoves.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }
}
