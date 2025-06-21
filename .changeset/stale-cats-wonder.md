---
"valimock": minor
---

Add support for new String validations and Keyword matchers

New Validations:

- base64
- bic
- creditCard
- decimal
- empty
- hexadecimal
- hexColor
- mac
- nanoid (unstable)
- octal

New keywords:

- username
- displayName
- firstName
- middleName
- lastName
- fullName
- gender
- sex
- zodiacSign
- isbn
- iban
- vin
- vrm

Also adds support for `empty()` for both Strings and Arrays
