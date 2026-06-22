import React from 'react';
import { Skeleton, TableBody, TableCell, TableRow } from '@mui/material';

export default function TableLoadingRows({ columns = 1, rows = 5 }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`table-loading-row-${rowIndex}`}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={`table-loading-cell-${rowIndex}-${columnIndex}`}>
              <Skeleton variant="rounded" height={24} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
