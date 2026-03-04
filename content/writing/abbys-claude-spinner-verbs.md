---
title: Abby's Claude Spinner Verbs
date: 2026-03-04
lastModified: 2026-03-04
---

# Abby's Claude Spinner Verbs

Claude Code shows a little verb while it thinks — "Analyzing...", "Considering..." — you can swap these out with anything you want. I made a few themed sets. Pick a section, copy the JSON, and drop it into your `~/.claude/settings.json`.

## How to use

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": ["...paste your list here..."]
  }
}
```

Use `"mode": "append"` if you want to keep the defaults and just add to them.

---

## Rajinikanth One-Liners

The Thalaiva himself. Let him narrate your coding sessions.

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": [
      "Mind it",
      "Vera level",
      "En vazhi thani vazhi",
      "Ivlo easy-a",
      "Kabali Da",
      "Style-a",
      "Don't mistake my kindness for weakness",
      "I don't get old, I level up",
      "Naan oru thadavai sonna nooru thadavai sonna maadiri",
      "Rewind panna mudiyathu",
      "Eppo varuven, eppadi varuven, yarukkum theriyathu",
      "Boss is always a boss",
      "Semma-ing"
    ]
  }
}
```

---

## Telugu Boothulu

For when you need Claude to reflect exactly how you feel at 2am debugging.

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": [
      "Denguతున్నా",
      "Gudda-ing",
      "Puku-ing",
      "Lanja-coding",
      "Bokka-debugging",
      "Nayana-ing",
      "Baadu-fixing",
      "Ammoru-deploying",
      "Pichodi-ing",
      "Arey-yem-ra-ing"
    ]
  }
}
```

---

More sections coming. If you've got a themed set you like, let me know.
