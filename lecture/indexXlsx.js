/*
  chaper 2 : xls파일 파싱하는 법
  npm i xlsx

  간단한 크롤링 : axios랑 cheerio 이용
  cheerio는 html 파싱해주는 라이브러리다

  링크들을 axios로 요청을 보내서 cheerio로 파싱을 하는거지
*/

// xlsx 파일 파싱하기
const xlsx = require("xlsx");
const axios = require("axios");
const cheerio = require("cheerio"); // html 파싱
const add_to_sheet = require("./add_to_sheet");
const fs = require("fs");
const puppeteer = require("puppeteer");

const workbook = xlsx.readFile("xlsx/data.xlsx"); // readfile로 엑셀 파일을 읽어와
console.log(Object.keys(workbook.Sheets)); // 무슨 시트들이 있는지, // 영화목록

const ws = workbook.Sheets.영화목록;

const records = xlsx.utils.sheet_to_json(ws); // 이걸로 복잡한 엑셀을 json으로 바꿔준다!!
// const records = xlsx.utils.sheet_to_json(ws, {header : "A"}); // 이렇게 하면 첫줄이 아닌 r.A,r.B,r.C...로 파싱됨
console.log(records); // 객체로 저장되어 있음

fs.readdir("poster", err => {
  if (err) {
    // 에러가 있으면 폴더가 없단 뜻이지
    fs.mkdirSync("poster"); // poster라는 디렉토리를 만들어줌
  }
});

fs.readdir("screenshot", err => {
  if (err) {
    // 에러가 있으면 폴더가 없단 뜻이지
    fs.mkdirSync("screenshot"); // poster라는 디렉토리를 만들어줌
  }
});

const crawlerCherrio = async () => {
  add_to_sheet(ws, "C1", "s", "평점"); // 시트에 쓰기
  for (const [index, r] of records.entries()) {
    // 이 for문으로 객체돌릴 때는 r,i 가 아닌 index,r이 라는것이 중요

    const response = await axios.get(r.링크); // response에 응답이 담기겠지?
    if (response.status === 200) {
      //응답이 성공한 경우
      const html = response.data; // 해당 페이지의 html이 담겨있음
      // 이렇게 받아온 html에서 내가 원하는것(ex-평점) 이런걸 찾으면 되지

      const $ = cheerio.load(html); // cheerio 사용을 여기서함 , 태그들에 접근을 가능하게, 태그내용은 사이트가서 개발자도구로 보고 와야겠지
      const text = $(".score.score_left .star_score").text(); //  클래스 명으로 해서 가져오면 됨 이렇게 score score_left 안에  star score   depth가 내려달땐 공백 필수!

      console.log(r.제목, "평점", text.trim()); // trim()으로 공백 제거해줘, 공백이 많이 들어있음

      // 넣을 셀
      const newCell = "C" + (index + 2);
      add_to_sheet(ws, newCell, "n", parseFloat(text.trim()));
    }
  }

  xlsx.writeFile(workbook, "xlsx/result.xlsx"); // 최종적으로 파일 만들기
  /*
         중요!!! 평점이 적히는 순서는 엑셀시트의 순서와 다르다!! Promise.all로 보냈는데 얘네가 각각의 속도가 달라져버린거지
        만약 엑셀에 적힌 순서대로 받고싶다면?
            ==> 결과의 순서를 보장하고 싶다면map으로 안하고 entries를 사용한 for문으로 하면 됨


          결론 :  for of문은 순서를 보장해주고
                 Promise.all()과 forEach()를 사용한 비동기 요청은 빠르지만 순서를 보장해주지 못함
                 순서냐 속도냐의 trade off
      */
};

const crawlerPuppeter = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === "production",
      args: ["--window-size=1920,1080"]
    });
    const page = await browser.newPage();

    // 화면(탭)크기를 키우는 매소드
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36"
    ); // 유저에이전트, 크롬 f12에 navigator.userAgent 치고 복사해서 가져와, 유저에이전트를 설정해서 봇 아닌척 하는거임

    add_to_sheet(ws, "C1", "s", "평점"); // 엑셀에 쓴느 방법, 제목에 평점 적은거임 지금
    for (const [i, r] of records.entries()) {
      await page.goto(r.링크);
      const result = await page.evaluate(() => {
        const scoreEl = document.querySelector(".score.score_left .star_score");
        let score = "";
        if (scoreEl) {
          score = scoreEl.textContent;
        }
        const imgEl = document.querySelector(".poster img"); // 포스터를 가져와야지
        let img = "";
        if (imgEl) {
          img = imgEl.src;
        }
        return { score, img };
      });

      if (result.score) {
        console.log(r.제목, "평점", result.score.trim());
        const newCell = "C" + (i + 2);
        add_to_sheet(ws, newCell, "n", result.score.trim());
      }

      if (result.img) {
        // 페이지 스크린샷 찍어서 해당 경로에 저장하기
        await page.screenshot({
          path: `screenshot/${r.제목}.png`,
          fullPage: true,
          /*
            clip 옵션은 좌표를 이용하여 원하는 부분만 캡쳐하는 유용한 기능임
            좌측 위 시작좌표와, width, heigth를 입력해주는 것임
            clip과 fullPage는 둘중에 하나만 쓸 수 있음
          */
          /*
            clip: {
              x : 100,
              y : 100,
              width : 300,
              height : 300
            }
           */
        });

        // ** 중요필기!!!
        // 이미지 파일 읽어와서 파일 저장해오는 것 이렇게 하는거 외워라 --> axios + {responseType : 'arraybuffer'}로 해서 받아온 후 writeFileSync로 쓰면 됨
        const imageResult = await axios.get(result.img.replace(/\?.*$/, ""), {
          responseType: "arraybuffer"
        });
        fs.writeFileSync(`poster/${r.제목}.jpg`, imageResult.data);
      }

      await page.waitFor(1000);
    }

    await page.close();
    await browser.close();
    xlsx.writeFile(workbook, "xlsx/result.xlsx");
  } catch (e) {
    console.log(e);
  }
};

crawlerPuppeter();
