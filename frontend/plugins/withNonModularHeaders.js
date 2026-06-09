const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withNonModularHeaders(config) {
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContents = fs.readFileSync(podfilePath, 'utf8');

      // 1. $RNFirebaseAsStaticFramework = true를 Podfile 맨 위에 추가
      if (!podfileContents.includes('$RNFirebaseAsStaticFramework')) {
        podfileContents = `$RNFirebaseAsStaticFramework = true\n\n${podfileContents}`;
      }

      // 2. post_install에서 non-modular headers 허용
      const snippet = `
    # Allow non-modular includes in framework modules (Firebase compatibility)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

      if (!podfileContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        podfileContents = podfileContents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${snippet}`
        );
      }

      fs.writeFileSync(podfilePath, podfileContents);
      return config;
    },
  ]);

  return config;
}

module.exports = withNonModularHeaders;
