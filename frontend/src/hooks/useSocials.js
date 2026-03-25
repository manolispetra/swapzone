import { useState, useEffect } from "react";

const DEFAULTS = {
  TWITTER_URL: "https://twitter.com/SwapZoneDEX",
  DISCORD_URL:  "https://discord.gg/swapzone",
};

export function useSocials() {
  const [socials, setSocials] = useState(DEFAULTS);

  useEffect(() => {
    fetch("/socials.txt")
      .then(r => r.text())
      .then(text => {
        const result = { ...DEFAULTS };
        text.split("\n").forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const [key, ...rest] = trimmed.split("=");
          if (key && rest.length) result[key.trim()] = rest.join("=").trim();
        });
        setSocials(result);
      })
      .catch(() => setSocials(DEFAULTS));
  }, []);

  return socials;
}
