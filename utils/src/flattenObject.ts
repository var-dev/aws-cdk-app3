export function flattenObject(obj:Record<string,any>, parent = '', res:Record<string,any> = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // const propName = parent ? `${parent}.${key}` : key;
      const propName = key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
  }
  return res;
}

// Example usage:
const nestedObject = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3,
      f: 4,
    },
  },
  g: 5,
};

const flattenedObject = flattenObject(nestedObject);
// console.log(flattenedObject);

// result   {a: 1, c: 2, e: 3, f: 4, g: 5}
