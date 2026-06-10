const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withNonModularHeaders(config) {
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContents = fs.readFileSync(podfilePath, 'utf8');

      // 1. pre_install: Force RNFB pods to build as static libraries (not frameworks)
      // This avoids modular header issues while keeping use_frameworks! for other pods
      const preInstallSnippet = `
$RNFirebaseAsStaticFramework = true

pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name.start_with?('RNFB')
      def pod.build_type
        Pod::BuildType.static_library
      end
    end
  end
end

`;

      if (!podfileContents.includes('pre_install do |installer|')) {
        podfileContents = preInstallSnippet + podfileContents;
      }

      // 2. post_install: Allow non-modular headers as safety net
      const postInstallSnippet = `
    # Allow non-modular includes in framework modules
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

      if (!podfileContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        podfileContents = podfileContents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${postInstallSnippet}`
        );
      }

      fs.writeFileSync(podfilePath, podfileContents);
      return config;
    },
  ]);

  return config;
}

module.exports = withNonModularHeaders;

module.exports = withNonModularHeaders;
