const { override, addBabelPlugins } = require('customize-cra');

module.exports = override(
  // This function adds the plugin to the Babel configuration for transpilation.
  // This forces dynamic import() to be converted to require() during the build,
  // which is compatible with environments that don't fully support ESM in scripts.
  addBabelPlugins(
    "babel-plugin-dynamic-import-node"
  )
);