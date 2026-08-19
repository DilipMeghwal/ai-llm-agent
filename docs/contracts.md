# API Contracts

## Customer (`GET /login/{username}/{password}`)

| Field         | Type   | Required | Format | Description                                             |
| ------------- | ------ | -------- | ------ | ------------------------------------------------------- |
| `id`          | number | ✅       | int32  | Unique Customer ID                                      |
| `firstName`   | string | ✅       | -      | Customer's first name                                   |
| `lastName`    | string | ✅       | -      | Customer's last name                                    |
| `address`     | object | ❌       | -      | Customer address details (street, city, state, zipCode) |
| `phoneNumber` | string | ❌       | -      | Contact phone number                                    |
| `ssn`         | string | ❌       | -      | Social Security Number                                  |
