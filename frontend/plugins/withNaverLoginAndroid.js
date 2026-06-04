const { withMainApplication } = require('@expo/config-plugins');

const IMPORT_LINE = 'import com.dooboolab.naverlogin.RNNaverLoginPackage';
const ADD_PACKAGE_LINE = 'add(RNNaverLoginPackage())';

function withNaverLoginAndroid(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Add import if not present
    if (!contents.includes(IMPORT_LINE)) {
      contents = contents.replace(
        'import expo.modules.ReactNativeHostWrapper',
        `import expo.modules.ReactNativeHostWrapper\n\n${IMPORT_LINE}`
      );
    }

    // Add package registration if not present
    if (!contents.includes(ADD_PACKAGE_LINE)) {
      contents = contents.replace(
        '// Packages that cannot be autolinked yet can be added manually here, for example:\n              // add(MyReactNativePackage())',
        `// Packages that cannot be autolinked yet can be added manually here, for example:\n              add(RNNaverLoginPackage())`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withNaverLoginAndroid;
