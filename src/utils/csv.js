const HEADERS = ['title', 'year', 'authors', 'found', 'notes', 'points'];

const getRows = data =>
  data
    .map(d => {
      return Object.entries(d)
        .reduce((row, [key, val]) => {
          if (HEADERS.includes(key)) row.push(val.replace(/,/gi, ' | ').replace(/\n/gi, ' | '));
          return row;
        }, [])
        .join(', ');
    })
    .join('\n');

export const generateCSV = exportedData => {
  const { data } = JSON.parse(exportedData).collections.find(
    collection => collection.name === 'papers'
  );

  return `${HEADERS.map(h => h.toUpperCase()).join(', ')}
${getRows(data)}`;
};
