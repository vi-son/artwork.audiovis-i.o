const CopyPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");
const fs = require("fs");
const package = require("./package.json");
const path = require("path");
const shell = require("shelljs");
const webpack = require("webpack");

function getVersionFromGit() {
  const gitTag = shell.exec("git describe --abbrev=0 --tags");
  const gitCommit = shell.exec("git rev-parse --short HEAD");
  return {
    tag: gitTag.trim(),
    commit: gitCommit.trim(),
    package: package,
  };
}

function readSamplesFromFiles() {
  const samples = {};
  const groups = fs
    .readdirSync(path.resolve(__dirname, "assets/audio/samples"))
    .filter((e) => e !== ".DS_Store");
  groups.forEach((group) => {
    samples[group] = fs
      .readdirSync(path.resolve(__dirname, `assets/audio/samples/${group}`))
      .filter((e) => e !== ".DS_Store")
      .map((file) => `${group}/${file}`);
  });
  console.group("--- SAMPLES ---");
  console.log(samples);
  console.groupEnd();
  return samples;
}

module.exports = (env) => {
  console.log(`ENV: ${env.NODE_ENV} / ${env.production}`);

  return {
    mode: "development",
    devServer: {
      port: 3333,
      host: "0.0.0.0",
      useLocalIp: true,
      historyApiFallback: true,
    },
    entry: {
      index: path.resolve(__dirname, "src/js/index.js"),
    },
    output: {
      path: path.resolve(__dirname, "build"),
      publicPath: "/",
      filename: "[name].[hash].bundle.js",
      chunkFilename: "[name].[hash].bundle.js",
    },
    resolve: {
      extensions: [".js"],
      alias: {
        "@sass": path.resolve(__dirname, "src/sass/"),
        "@glsl": path.resolve(__dirname, "src/glsl/"),
        "@assets": path.resolve(__dirname, "assets/"),
        "@routes": path.resolve(__dirname, "src/js/routes/"),
        "@components": path.resolve(__dirname, "src/js/components/"),
        "@utils": path.resolve(__dirname, "src/js/utils/"),
      },
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "babel-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(woff(2)?|ttf|otf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "fonts/",
              },
            },
          ],
        },
        {
          test: /\.mp3$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "assets/audio/",
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "babel-loader",
            },
            {
              loader: "react-svg-loader",
              options: {
                jsx: true, // true outputs JSX tags
              },
            },
          ],
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: ["glslify-import-loader", "raw-loader", "glslify-loader"],
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.VERSION": JSON.stringify(getVersionFromGit()),
        "process.env.SAMPLES": JSON.stringify(readSamplesFromFiles()),
      }),
      new HtmlWebpackPlugin({
        template: __dirname + "/src/html/index.html",
        filename: "index.html",
        inject: "body",
        hash: true,
      }),
      new FaviconsWebpackPlugin(
        path.resolve(`${__dirname}/assets/svg/favicon.svg`)
      ),
      new CopyPlugin({
        patterns: [{ from: path.resolve(__dirname, "assets"), to: "assets" }],
      }),
      new WorkboxPlugin.GenerateSW({
        swDest: "sw.js",
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: new RegExp("http://localhost:3333/*.js"),
            handler: "StaleWhileRevalidate",
          },
        ],
        maximumFileSizeToCacheInBytes: 15000000,
      }),
    ],
  };
};
