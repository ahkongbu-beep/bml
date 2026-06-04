const { withProjectBuildGradle } = require('@expo/config-plugins');

function withKakaoMavenRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    const kakaoMaven = "maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";

    if (!contents.includes('devrepo.kakao.com')) {
      contents = contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        "maven { url 'https://www.jitpack.io' }\n    " + kakaoMaven
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withKakaoMavenRepo;
