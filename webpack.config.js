module.exports = {
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: `./src/js/index.js`,

  // ファイルの出力設定
  output: {
    // 出力ファイル名
    filename: "bundle.js"
  },
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: "development"
};
