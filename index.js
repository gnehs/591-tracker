import fetch from "node-fetch";
import { load as cheerio } from "cheerio";
import colors from "colors";
import fs from "fs-extra";
import corn from "node-cron";
import { Telegram } from "telegraf";
const bot = new Telegram(process.env.BOT_TOKEN);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getBanner(banner, color = "blue") {
  const bgColor =
    "bg" +
    color
      .split("")
      .map((char, index) => (index === 0 ? char.toUpperCase() : char))
      .join("");
  return colors[bgColor](
    colors[`${color}`](`[`) +
      colors[`white`](`${banner}`) +
      colors[`${color}`](`]`)
  );
}
async function get591Data(searchParams) {
  const response = await fetch("https://rent.591.com.tw/?kind=0&region=1");
  const text = await response.text();
  const $ = cheerio(text);
  const csrfToken = $('meta[name="csrf-token"]').attr("content");
  const cookies = response.headers
    .raw()
    ["set-cookie"].map((cookie) => cookie.split(";")[0])
    .join("; ");

  let url = new URL("https://rent.591.com.tw/home/search/rsList");
  for (let [key, value] of Object.entries(searchParams)) {
    url.searchParams.append(key, value);
  }
  let result = await fetch(url.href, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-TW,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Microsoft Edge";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-csrf-token": csrfToken,
      "x-requested-with": "XMLHttpRequest",
      cookie: cookies,
    },
    referrer: url.href,
    method: "GET",
  });
  result = await result.json();
  return result.data.data;
}
async function fetchData() {
  let searchParams = {
    is_format_data: 1,
    is_new_list: 1,
    type: 1,
    mrtline: 162,
    searchtype: 4,
    multiRoom: 1,
    kind: 2,
    multiNotice: "not_cover",
    showMore: 1,
    option: "washer,cold,icebox",
    rentprice: ",15000",
  };
  // fetch results
  let result = [];
  for (let mrtcoods of [4244, 4245, 4246, 4184, 4231, 4232, 4200]) {
    console.log(getBanner(`591`) + getBanner(`fetch`, "yellow"), mrtcoods);
    result = [...result, ...(await get591Data({ mrtcoods, ...searchParams }))];
  }
  // filter results
  let storedIds = await getStoredId();
  result = result
    // filter by stored id
    .filter((data) => !storedIds.includes(data.post_id))
    // filter by keywords
    .filter(
      (data) => !["1+1", "樓中樓"].some((str) => data.title.includes(str))
    )
    // sort by distance
    .sort(
      (a, b) =>
        parseInt(a.surrounding.distance) - parseInt(b.surrounding.distance)
    );
  let ids = [...new Set(result.map((data) => data.post_id))];

  // send results
  console.log(
    getBanner(`591`) + getBanner(`result`, "yellow"),
    `${result.length} data`
  );
  for (let id of ids) {
    if ((await getStoredId()).includes(id)) continue;
    let data = result.find((data) => data.post_id === id);
    console.log(
      getBanner(`Telegram`) + getBanner(`send`, "yellow"),
      data.title
    );

    let msg = [
      `<a href="https://rent.591.com.tw/rent-detail-${data.post_id}.html">${data.title}</a>`,
      `🏠 ${data.kind_name} ${data.area}坪`,
      `🚪 ${data.floor_str} ${data.room_str}`,
      `📍 ${data.location}`,
      `🚊 ${data.surrounding.desc} ${data.surrounding.distance}`,
      `💵 ${data.price}${data.price_unit}`,
      data.rent_tag.map(({ name }) => `#${name}`).join(" "),
    ].join("\n");
    if (data.photo_list.length > 0) {
      await bot.sendMediaGroup(
        process.env.CHAT_ID,
        data.photo_list.slice(0, 4).map((url, i) => ({
          type: "photo",
          media: url,
          caption: i == 0 ? msg : null,
          parse_mode: "HTML",
        }))
      );
    } else {
      await bot.sendMessage(process.env.CHAT_ID, msg, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    }
    await storeId([data.post_id]);
    await delay(30 * 1000);
  }
}
async function getStoredId() {
  if (await fs.pathExists("./storedId.json")) {
    const storedId = await fs.readJSON("./storedId.json");
    return storedId;
  }
  return [];
}
async function storeId(ids) {
  ids = [...ids, ...(await getStoredId())];
  ids = [...new Set(ids)];
  await fs.writeJSON("./storedId.json", ids);
}

fetchData();
corn.schedule("0 */1 * * *", () => {
  fetchData();
});
