import React from 'react';

// Plain ruled data table for the programmatic pages: figures right-aligned, header row and caption for
// screen readers, horizontal scroll on narrow screens instead of squeezing the columns.
// `head` is a list of column titles; the first column is the row header.
const DataTable = ({ caption, head, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[22rem] border-collapse text-left text-[0.9375rem]">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b-2">
          {head.map((h, i) => (
            <th key={h} scope="col" className={`py-2 pr-4 font-semibold ${i ? 'text-right' : ''}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Cell = ({ children, first = false, strong = false }) =>
  first ? (
    <th scope="row" className="py-2 pr-4 font-normal">{children}</th>
  ) : (
    <td className={`fig py-2 pr-4 text-right ${strong ? 'font-semibold' : ''}`}>{children}</td>
  );

export default DataTable;
