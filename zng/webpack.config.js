module.exports = (options) => ({
  ...options,
  devtool: 'inline-source-map', // Use inline source maps for better path resolution
  output: {
    ...options.output,
    sourceMapFilename: '[file].map', // Ensure source maps are generated in the same directory as the output file
  },
});
