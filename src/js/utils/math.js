const remap = (v, a, b, c, d) => {
  const newval = ((v - a) / (b - a)) * (d - c) + c;
  return newval;
};

const randomIndex = (max) => {
  return Math.floor(Math.random(), max);
};

export { remap, randomIndex };
