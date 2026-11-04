---
"valimock": patch
---

Fix string generation skipping the length bound when a key-name generator (such as `faker.lorem.text()` for a `text` key) produced a value longer than the schema's `maxLength`/`maxGraphemes`/`maxBytes` allowed.
