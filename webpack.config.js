const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', //웹팩 실행 모드 설정 (development - 개발용 모드. source map을 생성해 디버깅을 용이하게 함
  entry: './src/index.ts', //웹팩에서 번들링할 파일의 진입점을 지정
  devtool: 'inline-source-map', //소스 맵을 생성하고 디버깅을 용이하게 함 (inline-source-map : 소스맵(:번들링된 js 파일과 원본 소스 파일간의 매핑 정보를 제공하는 파일)을 번들 파일에 직접 포함시킴)
  plugins: [
    new HtmlWebpackPlugin({ //HtmlWebpackPlugin 설정
      template: "dist/index.html", //기본 템플릿 파일을 지정
      inject: false, //HTML 파일에 자동으로 script 태그를 추가하지 않도록 설정. (웹팩에서 생성한 번들 파일을 수동으로 script 태그에 추가해야 함)
    }),
  ],
  module: { //모듈을 로드할 때 적용하는 규칙
    rules: [
      {
        test: /[\.js]$/, //해당 규칙이 적용될 파일의 경로를 지정 (모든 .js 파일에 해당 규칙 적용)
        exclude: /node_module/, //해당 규칙이 적용되지 않을 디렉토리
        use: { //해당 규칙이 적용될 때 사용할 loader를 지정
          loader: "babel-loader", //babel-loader를 사용해 js코드를 컴파일
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_module/,
        use: {
          loader: "ts-loader", //TS 코드를 JS로 변환함
        },
      },
    ],
  },
  resolve: { //웹팩이 모듈을 해석할 때 사용하는 옵션으로, 모듈 해석 시 참조하는 파일의 확장자를 지정
    extensions: [".tsx", ".ts", ".js"],
    //import 구문에서 파일 확장자를 생략해도 웹팩이 지정된 확장자를 순서대로 참조해 파일을 찾음
    //모듈 불러오 때 파일명에 대한 확장자를 생략할 수 있으므로 코드 간결하게 유지 가능
  },
  output: { //웹팩으로 빌드한 파일의 출력 설정
    filename: "bundle.js", //빌드된 파일의 이름 지정
    path: path.resolve(__dirname, "dist"), //빌드된 파일을 저장할 경로 지증
    /*
    * __dirname : 현재 파일이 위치한 디렉토리 경로
    * "dist" : 빌드된 파일을 지정할 디렉토리
    * path.resolve 함수 : 상대 경로를 절대 경로로 변경 (빌드된 파일이 항상 지정된 경로에 저장됨)
    * */
  },
  devServer: { //webpack-dev-server 설정
    host: "localhost", //개발 서버를 호스팅할 호스트 이름
    port: 5000, //개발 서버를 실행할 포트 번호 지정
    static: { //정적 파일을 제공할 디렉토리를 설정
      directory: path.join(__dirname, "dist"), //"dist" 디렉토리에 있는 파일들 제공 가능
    },
    open: true, //개발 서버가 실행될 때 자동으로 브라우저 open (서버가 정상적으로 작동하는지 쉽게 확인 가능)
  },
}
