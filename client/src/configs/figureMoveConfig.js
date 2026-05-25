import { eChessFigure } from '../enums/eChessFigure.js';

export const whitePawnMovePattern = [
  [
    { row: +1, column: 0 },
    {
      row: +2,
      column: 0,
      condition: ({ row }) => {
        return row === 2;
      },
    },
  ],
];
export const blackPawnMovePattern = [
  [
    { row: -1, column: 0 },
    {
      row: -2,
      column: 0,
      condition: ({ row }) => {
        return row === 7;
      },
    },
  ],
];
export const rookMovePattern = [
  [
    { row: +1, column: 0 },
    { row: +2, column: 0 },
    { row: +3, column: 0 },
    { row: +4, column: 0 },
    { row: +5, column: 0 },
    { row: +6, column: 0 },
    { row: +7, column: 0 },
  ],
  [
    { row: -1, column: 0 },
    { row: -2, column: 0 },
    { row: -3, column: 0 },
    { row: -4, column: 0 },
    { row: -5, column: 0 },
    { row: -6, column: 0 },
    { row: -7, column: 0 },
  ],
  [
    { row: 0, column: +1 },
    { row: 0, column: +2 },
    { row: 0, column: +3 },
    { row: 0, column: +4 },
    { row: 0, column: +5 },
    { row: 0, column: +6 },
    { row: 0, column: +7 },
  ],
  [
    { row: 0, column: -1 },
    { row: 0, column: -2 },
    { row: 0, column: -3 },
    { row: 0, column: -4 },
    { row: 0, column: -5 },
    { row: 0, column: -6 },
    { row: 0, column: -7 },
  ],
];
export const knightMovePattern = [
  [{ row: +2, column: +1 }],
  [{ row: +2, column: -1 }],
  [{ row: -2, column: +1 }],
  [{ row: -2, column: -1 }],
  [{ row: +1, column: +2 }],
  [{ row: -1, column: +2 }],
  [{ row: -1, column: -2 }],
  [{ row: +1, column: -2 }],
];
export const bishopMovePattern = [
  [
    { row: +1, column: +1 },
    { row: +2, column: +2 },
    { row: +3, column: +3 },
    { row: +4, column: +4 },
    { row: +5, column: +5 },
    { row: +6, column: +6 },
    { row: +7, column: +7 },
  ],
  [
    { row: +1, column: -1 },
    { row: +2, column: -2 },
    { row: +3, column: -3 },
    { row: +4, column: -4 },
    { row: +5, column: -5 },
    { row: +6, column: -6 },
    { row: +7, column: -7 },
  ],
  [
    { row: -1, column: +1 },
    { row: -2, column: +2 },
    { row: -3, column: +3 },
    { row: -4, column: +4 },
    { row: -5, column: +5 },
    { row: -6, column: +6 },
    { row: -7, column: +7 },
  ],
  [
    { row: -1, column: -1 },
    { row: -2, column: -2 },
    { row: -3, column: -3 },
    { row: -4, column: -4 },
    { row: -5, column: -5 },
    { row: -6, column: -6 },
    { row: -7, column: -7 },
  ],
];
export const queenMovePattern = [...rookMovePattern, ...bishopMovePattern];
export const kingMovePattern = [
  [{ row: +1, column: 0 }],
  [{ row: -1, column: 0 }],
  [{ row: 0, column: +1 }],
  [{ row: 0, column: -1 }],
  [{ row: +1, column: +1 }],
  [{ row: +1, column: -1 }],
  [{ row: -1, column: +1 }],
  [{ row: -1, column: -1 }],
];

export const figureMoveConfig = {
  [eChessFigure.PAWN]: { white: whitePawnMovePattern, black: blackPawnMovePattern },
  [eChessFigure.ROOK]: rookMovePattern,
  [eChessFigure.KNIGHT]: knightMovePattern,
  [eChessFigure.BISHOP]: bishopMovePattern,
  [eChessFigure.QUEEN]: queenMovePattern,
  [eChessFigure.KING]: kingMovePattern,
};
