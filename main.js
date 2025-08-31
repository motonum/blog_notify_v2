// デバッグモード切り替え
const DEBUG_MODE = true;

// 入出力用情報
const ATOM_URL = "{{ATOM_URL}}";
const SITE_URL = "{{SITE_URL}}";
const TEST_WEBHOOK_URL = "{{TEST_WEBHOOK_URL}}";
const MAIN_WEBHOOK_URL = "{{MAIN_WEBHOOK_URL}}";
const WEBHOOK_URL = DEBUG_MODE ? TEST_WEBHOOK_URL : MAIN_WEBHOOK_URL;

const USER_ID = "{{USER_ID}}";
const PASSWORD = "{{PASSWORD}}";

// 時間計算用定数
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

const MILLISECONDS_PER_DAY =
  MILLISECONDS_PER_SECOND *
  SECONDS_PER_MINUTE *
  MINUTES_PER_HOUR *
  HOURS_PER_DAY;

class ExDate extends Date {
  setTime(h = 0, m = 0, s = 0, ms = 0) {
    this.setHours(h);
    this.setMinutes(m);
    this.setSeconds(s);
    this.setMilliseconds(ms);
    return this;
  }
  isWithinLast24Hours(date) {
    return (date - this) / MILLISECONDS_PER_DAY < 1;
  }
}

function refreshTrigger() {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers
    .filter((trigger) => trigger.getHandlerFunction() === "main")
    .forEach((trigger) => {
      ScriptApp.deleteTrigger(trigger);
    });
  const next = new ExDate().setTime(8);
  ScriptApp.newTrigger("main").timeBased().at(next).create();
}

function getLatestEntry() {
  const atomXml = UrlFetchApp.fetch(ATOM_URL, {
    method: "GET",
    headers: {
      Authorization:
        "Basic " + Utilities.base64Encode(USER_ID + ":" + PASSWORD),
    },
    muteHttpExceptions: true,
  }).getContentText();
  const document = XmlService.parse(atomXml);
  const root = document.getRootElement();
  const ns = XmlService.getNamespace("http://purl.org/atom/ns#");
  const entries = root.getChildren("entry", ns);
  const latest = entries
    .map((entry) => {
      return {
        issued: new ExDate(entry.getChild("issued", ns).getText()),
        title: entry.getChild("title", ns).getText(),
        summary: entry
          .getChild("summary", ns)
          .getText()
          .replace(/\&.+\;/g, "")
          .replace(/\s+/g, " "),
        url: entry.getChild("id", ns).getText(),
      };
    })
    .reduce((prev, curr) => (prev.issued > curr.issued ? prev : curr));

  return latest;
}

function postDiscord(message) {
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    payload: JSON.stringify({ content: `${message}` }),
  });
}

function main() {
  const latest = getLatestEntry();

  if (latest && latest.issued.isWithinLast24Hours(new ExDate().setTime(8))) {
    postDiscord(`### ${latest.title}\n${latest.summary}\n${latest.url}`);
  }
}
