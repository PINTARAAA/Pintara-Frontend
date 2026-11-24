import { createCn } from "cn/config"

/*
 * cn() yang mengenal token PINTARA (src/styles/tokens.css).
 * Tanpa ini, `text-subtitle` dianggap warna teks dan akan menimpa
 * `text-primary-text-label` (atau sebaliknya) saat class digabung.
 */
export const cn = createCn({
  extend: {
    theme: {
      text: [
        "h1",
        "h2",
        "h3",
        "h4",
        "headline",
        "body",
        "subtitle",
        "caption",
        "footnote",
      ],
      spacing: [
        "ns-3xs",
        "ns-2xs",
        "ns-xs",
        "ns-s",
        "ns-m",
        "ns-l",
        "ns-xl",
        "ns-2xl",
        "ns-3xl",
        "ns-4xl",
      ],
    },
  },
})
