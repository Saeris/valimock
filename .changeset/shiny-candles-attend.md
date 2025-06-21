---
"valimock": patch
---

Fix incorrect string max length behavior, Update dependencies

Strings were accidentally being capped to a fixed max length when a `maxLength()` validation was not provided by the schema, resulting in unwanted behavior such as the shortening of usernames, emails, etc, which would cause validations such as `email()` to fail against the resulting mock data.
