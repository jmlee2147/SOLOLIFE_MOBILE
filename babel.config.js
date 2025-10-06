module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@assets": "./src/assets",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@providers": "./src/providers",
            "@utils": "./src/utils",
            "@config": "./src/config",
            "@services": "./src/services",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
