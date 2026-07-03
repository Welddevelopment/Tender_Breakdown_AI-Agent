export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bidframe.org"
).replace(/\/$/, "");

export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ??
  "https://cal.com/joel-jeon-o29lfr/bidframe";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export const DEFAULT_OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Never miss a bid, over Bidframe's forest clearing landing visual.",
};
