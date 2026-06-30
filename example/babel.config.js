module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@iconifybeyond/react-native-quick-tiles': '../src/index',
        },
      },
    ],
  ],
};
