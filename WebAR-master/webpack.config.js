const path = require("path");
module.exports = {
    mode: 'production', // or "development" or "none"
    entry: './lab4/practice4.js',
    output: {
        path: path.resolve(__dirname, "dist"),        
        filename: './bundle2.js',
        //filename: "[name].bundle.js",
    },
    experiments: {
        topLevelAwait: true,
      },
}