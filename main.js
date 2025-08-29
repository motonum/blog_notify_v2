const ATOM_URL = "{{ATOM_URL}}";
const SITE_URL = "{{SITE_URL}}";

const DEBUG_MODE = true;

const TEST_WEBHOOK_URL = "{{TEST_WEBHOOK_URL}}";

const MAIN_WEBHOOK_URL = "{{MAIN_WEBHOOK_URL}}";

const WEBHOOK_URL = DEBUG_MODE ? TEST_WEBHOOK_URL : MAIN_WEBHOOK_URL;

// アクセス先の情報
const USER_ID = "{{USER_ID}}";
const PASSWORD = "{{PASSWORD}}";

// GETメソッドのオプション
const options = {
  method: "GET",
  headers: {
    Authorization: " Basic " + Utilities.base64Encode(USER_ID + ":" + PASSWORD),
  },
  muteHttpExceptions: true,
};

class ExDate extends Date {
  toFormattedString() {
    return this.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }
  omitTime() {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
  }
  shiftDate(days = 1) {
    this.setDate(this.getDate() + days);
    return this;
  }
}

function refreshTrigger() {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers
    .filter((trigger) => trigger.getHandlerFunction() === "main")
    .forEach((trigger) => {
      ScriptApp.deleteTrigger(trigger);
    });
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0);
  ScriptApp.newTrigger("main").timeBased().at(next).create();
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
  const atomXml = UrlFetchApp.fetch(ATOM_URL, options).getContentText();
  const document = XmlService.parse(atomXml);
  const root = document.getRootElement();
  const ns = XmlService.getNamespace("http://purl.org/atom/ns#");
  const entries = root.getChildren("entry", ns);
  const latest = entries
    .map((entry) => {
      return {
        issued: new Date(entry.getChild("issued", ns).getText()),
        title: entry.getChild("title", ns).getText(),
        summary: entry
          .getChild("summary", ns)
          .getText()
          .replace(/\&.+\;/g, ""),
        url: entry.getChild("id", ns).getText(),
      };
    })
    .reduce((prev, curr) => (prev.issued > curr.issued ? prev : curr));

  const summary = latest.summary.replace(/\s+/g, " ");

  postDiscord(`### ${latest.title}\n${summary}\n${latest.url}`);
}
