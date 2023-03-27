import fetch from 'node-fetch';
import { load as cheerio } from 'cheerio';
import colors from 'colors';
// import { Telegraf } from 'telegraf';

// const bot = new Telegraf(process.env.BOT_TOKEN);

async function get591Data() {
  console.log(getBanner(`591`), 'getting cookies and csrf token...');
  const response = await fetch('https://rent.591.com.tw/?kind=0&region=1');
  const text = await response.text();
  const $ = cheerio(text);
  const csrfToken = $('meta[name="csrf-token"]').attr('content');
  const cookies = response.headers.raw()['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ');
  console.log(getBanner(`591`) + getBanner(` cookies `, 'yellow'), `${response.headers.raw()['set-cookie'].length} cookies`);
  console.log(getBanner(`591`) + getBanner(`csrfToken`, 'yellow'), csrfToken);

  console.log(getBanner(`591`), 'getting data...');
  let url = new URL('https://rent.591.com.tw/home/search/rsList');
  url.searchParams.append('is_format_data', '1');
  url.searchParams.append('is_new_list', '1');
  url.searchParams.append('type', '1');
  url.searchParams.append('multiRoom', '2,3');
  url.searchParams.append('region', '1');
  url.searchParams.append('mrtline', '162');
  url.searchParams.append('mrtcoods', '4231,4184,4200,4221,66266');
  url.searchParams.append('searchtype', '4');
  url.searchParams.append('other', 'lift');
  url.searchParams.append('rentprice', ',30000');
  url.searchParams.append('order', 'posttime');
  url.searchParams.append('orderType', 'desc');
  let result = await fetch(url.href, {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-TW,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Microsoft Edge\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-csrf-token": csrfToken,
      "x-requested-with": "XMLHttpRequest",
      "cookie": cookies
    },
    "referrer": url.href,
    "method": "GET",
  });
  result = await result.json();
  console.log(getBanner(`591`) + getBanner(` result `, 'yellow'), result.data.data);
}
function getBanner(banner, color = 'blue') {
  const bgColor = "bg" + color.split('').map((char, index) => index === 0 ? char.toUpperCase() : char).join('');
  return colors[bgColor](
    colors[`${color}`](`[`) +
    colors[`white`](`${banner}`) +
    colors[`${color}`](`]`)
  )
}

get591Data();