# jRevolver

A robust app for generating mock JSON for development and testing purposes.

# Intent

To build a flexible and robust mock data generation tool that can be easily be plugged into many different development pipelines.

# Features

    Combine JSON files – includes files within other files
    Define multiple possible values for a single JSON key
    Automatically generate mock JSON, respecting all value permutations for multiple keys
    Define a exclude list for specific key/value combinations
    Define a allow list for specific key/value combinations
    Other useful features such as comments and control over outputted mock filenames

## Examples

---
### --map
---

`--map` allows you assign many different values to a single property, generating a permutation for each discrete value.

#### Simple Use

`map_simple_use.json`
```
{
  "temperature": "AbsoluteZero",
  "--map numberOfGrams": [ 111, 343 ],
  "--map metal": [ "Iridium", "Platinum" ]
}
```

This would generate 2x2=**4 mocks**

`map_simple_use.json` – generated mocks
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Platinum"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal": "Platinum"
}
```

#### Simple use with Objects as values

`map_simple_use_objects_as_values.json`
```
{
  "--map priceData": [
    {
      "price": 111.11,
      "currency": "USD"
    },
    {
      "price": 1234.5,
      "currency": "CAD"
    },
    {
      "price": 54321,
      "currency": "AUD"
    }
  ]
}
```

This would generate **3 mocks**

`map_simple_use_objects_as_values.json` — generated mocks
```
{
  "priceData": {
    "price": 111.11,
    "currency": "USD"
  }
}
```
```
{
  "priceData": {
    "price": 1234.5,
    "currency": "CAD"
  }
}
```
```
{
  "priceData": {
    "price": 54321,
    "currency": "AUD"
  }
}
```

---
### --mapZipper
---

`--mapZipper` zips maps together in an alternating pattern.

Outputted files will be the same as when using `--map`, but when using `parseLayout()` directly, you'll have the benefit of the map values alternating.
You must include the values to zip together using `--include` with `PERMUTE`.

#### Simple Use

`includes/numbers.json`
```
{
  "--mapZipper number": [ 1, 2, 3, 4 ]
}
```

`mapZipper_simple_use.json`
```
{
  "--include includes/numbers.json": "PERMUTE",
  "--mapZipper number": [ 5, 6, 7, 8 ]
}
```

`parseLayout()` output, in order:

```
{
  "number": 1
}
```
```
{
  "number": 5
}
```
```
{
  "number": 2
}
```
```
{
  "number": 6
}
```
```
{
  "number": 3
}
```
```
{
  "number": 7
}
```
```
{
  "number": 4
}
```
```
{
  "number": 8
}
```

---
### Current context maps
---

You can use a `--map` with no property name to permute the values inside within the current JSON context (instead of on a new property).

`map_with_current_context.json`
```
{
  "temperature": "AbsoluteZero",
  "metal": "Iridium",
  "weight": 100,
  "--map": [
    {
      "metal": "Heavy",
      "weight": 9999,
      "baryons": 1
    },
    {
      "metal": "Gallium",
      "weight": 69.723
    },
    {
      "metal": "Bismuth",
      "baryons": "209"
    }
  ]
}
```

This would generate **3 mocks**

`map_with_current_context.json` – generated mocks
```
{
  "temperature": "AbsoluteZero",
  "metal": "Heavy",
  "weight": 9999,
  "baryons": 1
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Gallium",
  "weight": 69.723
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Bismuth",
  "weight": 100,
  "baryons": "209"
}
```

#### Simple use with Exclude

`map_simple_use_with_exclude.json`
```
{
  "temperature": "AbsoluteZero",
  "--map numberOfGrams": [ 111, 343, 882 ],
  "--map metal": [ "Iridium", "Platinum", "Heavy" ],
  "--mapExclude": [
    {
      "numberOfGrams": 343
    },
    {
      "numberOfGrams": 111,
      "metal": "Heavy"
    }
  ]
}
```

This would generate 3x3=9-4=**5 mocks**

`map_simple_use_with_exclude.json` – generated mocks
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Platinum"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 882,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 882,
  "metal": "Platinum"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 882,
  "metal": "Heavy"
}
```

With the Exclude list, these mocks will not be generated:

`map_simple_use_with_exclude.json` – excluded mocks
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Heavy"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal": "Platinum"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal": "Heavy"
}
```

#### Simple use with allowOnly

`map_simple_use_with_allow_only.json`
```
{
  "temperature": "AbsoluteZero",
  "--map numberOfGrams": [ 111, 343, 882 ],
  "--map metal": [ "Iridium", "Platinum", "Heavy" ],
  "--mapAllowOnly": [
    {
      "numberOfGrams": 111
    },
    {
      "metal": "Heavy"
    }
  ]
}
```

This would generate **4 mocks**

`map_simple_use_with_allow_only.json` – generated mocks
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Iridium"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Platinum"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 111,
  "metal": "Heavy"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 343,
  "metal: "Heavy"
}
```
```
{
  "temperature": "AbsoluteZero",
  "numberOfGrams": 882,
  "metal: "Heavy"
}
```

#### Complex uses

`map_complex_use.json`
```
{
  "temperature": "AbsoluteZero",
  "--map numberOfGrams": [ 111, 343, 882 ],
  "--map metal": [ "Iridium", "Platinum", "Bismuth", "Heavy" ],
  "--map priceData": [
    {
      "--mapKey": "murrica",
      "price": 111.11,
      "currency": "USD"
    },
    {
      "--mapKey": "MilkComesInBags",
      "price": 1234.5,
      "currency": "CAD"
    },
    {
      "--mapKey": "DeawnUndah",
      "price": 54321,
      "currency": "AUD"
    }
  ],
  "--map RandomStuff": [
    {
      "--mapKey": "ImOnMars",
      "ping": 123332,
      "lotsOfLag": true
    },
    {
      "--mapKey": "myLife",
      "codeStatus": "reviewed",
      "isTrunkOpen": false
    },
    {
      "--mapKey": "thatOneSong",
      "howOldAmI": null,
      "lifeQuestion": "What's my...",
      "age": 182
    }
  ]
}
```

`map_complex_use_with_exclude.json`
```
{
  "temperature": "NuclearBomb",
  "--map numberOfGrams": [ 111, 343, 882 ],
  "--map metal": [ "Iridium", "Platinum", "Bismuth", "Heavy" ],
  "--map price": [
    {
      "--mapKey": "dollars",
      "trueValue": "$12355"
    },
    {
      "--mapKey": "numbers",
      "trueValue": 111.2
    },
    {
      "--mapKey": "nothingHere",
      "trueValue": null
    }
  ],
  "--mapExclude": [
    {
      "numberOfGrams": 343,
      "metal": "Bismuth"
    },
    {
      "numberOfGrams": 111,
      "metal": "Heavy",
      "price": "--mapKey dollars"
    }
  ]
}
```

`map_complex_use_with_allow_only.json`
```
{
  "temperature": "NotANumber",
  "--map numberOfGrams": [ 111, 343, 882 ],
  "--map metal": [ "Iridium", "Platinum", "Bismuth", "Heavy" ],
  "--map price": [ "$12355", 111.2, null ],
  "--mapAllowOnly": [
    {
      "numberOfGrams": 343
    },
    {
      "numberOfGrams": 882,
      "metal": "Platinum",
      "price": null
    }
  ]
}
```

---
### --mapContent: exclude and allow lists with non-object values
---

In order to exclude or allow a permutation for a map where the value is a non-primitive type, it must have a `--mapKey` property. But what if you want to filter a value that is an Array, or another non-Object that is also not a JSON primitive type? `--mapContent` allows you to do this:

`map_with_mapContent.json`
```
{
  "temperature": "AbsoluteZero",
  "--map metal": [ "Iridium", "Heavy" ],
  "--map endsUpAnArray": [
    {
      "--mapKey": "dubble",
      "--mapContent": [ 2, 22 ]
    },
    {
      "--mapKey": "tripple",
      "--mapContent": [ 1, 2, 77 ]
    },
    {
      "--mapKey": "ggH",
      "--mapContent": [ 42, 88 ]
    }
  ],
  "--mapExclude": [
    {
      "metal": "Heavy",
      "endsUpAnArray": "--mapKey ggH"
    }
  ]
}
```

This will output the mocks:

`map_with_mapContent.json` – generated mocks
```
{
  "temperature": "AbsoluteZero",
  "metal": "Iridium",
  "endsUpAnArray": [
    42,
    88
  ]
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Heavy",
  "endsUpAnArray": [
    2,
    22
  ]
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Iridium",
  "endsUpAnArray": [
    2,
    22
  ]
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Heavy",
  "endsUpAnArray": [
    1,
    2,
    77
  ]
}
```
```
{
  "temperature": "AbsoluteZero",
  "metal": "Iridium",
  "endsUpAnArray": [
    1,
    2,
    77
  ]
}
```

The value of the `--mapContent` property (the array) becomes the value of endsUpAnArray (for that permutation). We are also excluding the permutation indexed by `--mapKey` "ggH".

---
### --include
---

`--include` allows you to combine multiple JSON files

#### Simple Use with `DEFAULTS`

`includes/metaData.json`
```
{
  "firstName": "bob",
  "lastName": "smith",
  "numEmailsSent": 5
}
```

`include_simple_use.json`
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": "--include includes/metaData.json"
}
```

This would output the mock:

`include_simple_use.json` - generated mock
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "firstName": "bob",
    "lastName": "smith",
    "numEmailsSent": 5
  }
}
```

Simple use, with default values

`include_simple_use.json`
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "--include includes/metaData.json": "DEFAULTS",
    "numEmailsSent": 10
  }
}
```

This would output the mock:

`include_simple_use.json` – generated mocks
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "firstName": "bob",
    "lastName": "smith",
    "numEmailsSent": 10
  }
}
```

Notice how the default value for numEmailsSent has been overridden.

#### Simple Use, with `OVERRIRDES`

`include_simple_use_overrides.json`
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "--include includes/metaData.json": "OVERRIDES",
    "numEmailsSent": 15
  }
}
```

This would output the mock:

`include_simple_use_overrides.json` – generated mocks
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "firstName": "bob",
    "lastName": "smith",
    "numEmailsSent": 5
  }
}
```

Notice how the included value has overridden the value in the base JSON file.

#### Simple use, with `PERMUTE`

`include_simple_use_permute.json`
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "--include includes/metaData.json": "PERMUTE",
    "numEmailsSent": 10
  }
}
```

This would output the mocks:

`include_simple_use_permute.json` – generated mocks
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "firstName": "bob",
    "lastName": "smith",
    "numEmailsSent": 5
  }
}
```
```
{
  "experiments": {
    "canSendEmails": true
  },
  "metaData": {
    "firstName": "bob",
    "lastName": "smith",
    "numEmailsSent": 10
  }
}
```

You could also use a `--map` on numEmailsSent to generate even more permutations.

---
### --concat
---

`--concat` concatenates property values together.

Supports `Array`, `String`, `Boolean`, `Number`, and `null` types.

When concatenating with a `String`, `Boolean`, `Number`, and `null` types are converted to a `String`.

When including additional files, `--concat`'s are merged together.

`sample_concat_merge.json`
```
{
  "propStringWithString": "abcdef",
  "--concat propStringWithString": "123456",
  "propStringWithNumber": "abcdef",
  "--concat propStringWithNumber": 123456,
  "propStringWithArray": "abcdef",
  "--concat propStringWithArray": [1, 2, 3, 4, 5, 6],
  "propStringWithNull": "abcdef",
  "--concat propStringWithNull": null,
  "propStringWithBooleanTrue": "abcdef",
  "--concat propStringWithBooleanTrue": true,
  "propStringWithBooleanFalse": "abcdef",
  "--concat propStringWithBooleanFalse": false,

  "propArrayWithString": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithString": "123456",
  "propArrayWithNumber": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithNumber": 123456,
  "propArrayWithArray": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithArray": [ 1, 2, 3, 4, 5, 6 ],
  "propArrayWithBooleanTrue": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithBooleanTrue": true,
  "propArrayWithBooleanFalse": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithBooleanFalse": false,
  "propArrayWithNull": ["g", "h", "i", "j", "k", "l"],
  "--concat propArrayWithNull": null,

  "propNullWithString": null,
  "--concat propNullWithString": "123456",
  "propNullWithNumber": null,
  "--concat propNullWithNumber": 123456,
  "propNullWithArray": null,
  "--concat propNullWithArray": [1, 2, 3, 4, 5, 6],
  "propNullWithBooleanTrue": null,
  "--concat propNullWithBooleanTrue": true,
  "propNullWithBooleanFalse": null,
  "--concat propNullWithBooleanFalse": false,
  "propNullWithNull": null,
  "--concat propNullWithNull": null
}
```

`includes/concat.json`
```
{
  "--concat propStringWithString": "_aaabbb_"
}
```

`sample_concat.json` - generated mock
```
{
  "propArrayWithArray": ["g", "h", "i", "j", "k", "l", 1, 2, 3, 4, 5, 6],
  "propArrayWithBooleanFalse": ["g", "h", "i", "j", "k", "l", false],
  "propArrayWithBooleanTrue": ["g", "h", "i", "j", "k", "l", true],
  "propArrayWithNull": ["g", "h", "i", "j", "k", "l", null],
  "propArrayWithNumber": ["g", "h", "i", "j", "k", "l", 123456],
  "propArrayWithString": ["g", "h", "i", "j", "k", "l", "123456"],
  "propNullWithArray": [null, 1, 2, 3, 4, 5, 6],
  "propNullWithBooleanFalse": "nullfalse",
  "propNullWithBooleanTrue": "nulltrue",
  "propNullWithNull": "nullnull",
  "propNullWithNumber": "null123456",
  "propNullWithString": "null123456",
  "propStringWithArray": ["abcdef", 1, 2, 3, 4, 5, 6],
  "propStringWithBooleanFalse": "abcdeffalse",
  "propStringWithBooleanTrue": "abcdeftrue",
  "propStringWithNull": "abcdefnull",
  "propStringWithNumber": "abcdef123456",
  "propStringWithString": "abcdef123456_aaabbb_"
}
```

---
### --zipperMerge
---

`--zipperMerge` merges property values together in an alternating pattern.

Supports `Array`, `String`, `Boolean`, `Number`, and `null` types.

When merging with a `String`, `Boolean`, `Number`, and `null` types are converted to a `String`.

When including additional files, all `--zipperMerge`'s are zipped together in an alternating pattern.

`sample_zipperMerge.json`
```
{
  "propStringWithString": "abcdef",
  "--zipperMerge propStringWithString": "123456",
  "propStringWithArray": "abcdef",
  "--zipperMerge propStringWithArray": [ 1, 2, 3, 4, 5, 6 ],

  "propArrayWithString": [ "g", "h", "i", "j", "k", "l" ],
  "--zipperMerge propArrayWithString": "123456",
  "propArrayWithArray": [ "g", "h", "i", "j", "k", "l" ],
  "--zipperMerge propArrayWithArray": [ 1, 2, 3, 4, 5, 6 ],
  "propArrayWithNull": [ "g", "h", "i", "j", "k", "l" ],
  "--zipperMerge propArrayWithNull": null,

  "--include includes/zipperMerge.json": "DEFAULTS"
}
```

`includes/zipperMerge.json`
```
{
  "--zipperMerge propStringWithString": "_778899_",
  "--zipperMerge propStringWithArray": [ 7, 8, 9, 10, 11 ],

  "--zipperMerge propArrayWithString":  "_778899_",
  "--zipperMerge propArrayWithArray": [ 7, 8, 9, 10, 11 ],
  "--zipperMerge propArrayWithNull": null
}
```

`sample_zipperMerge.json` - generated mock
```
{
  "propArrayWithArray": ["g", 7, 1, 8, "h", 9, 2, 10, "i", 11, 3, "j", 4, "k", 5, "l", 6],
  "propArrayWithNull": ["g", null, null, "h", "i", "j", "k", "l"],
  "propArrayWithString": ["g", "_778899_", "123456", "h", "i", "j", "k", "l"],
  "propStringWithArray": "abcdef",
  "propStringWithString": "a_17b728c839d94_e5f6"
}
```

### Other useful information

A map in a file that is included with `DEFAULTS` will be overridden by an identically named non-map property in the root JSON file.

`metaData.json`
```
{
  "--map numEmailsSent": [ 5, 10 ]
}
```

`rootMock.json`
```
{
  "--include metaData.json": "DEFAULTS",
  "numEmailsSent": 20
}
```

Will result in the mock:

`rootMock.json` – generated mock
```
{
  "numEmailsSent": 20
}
```

A property in a file that is included with `DEFAULTS` will be overridden by an identically named map in the root JSON file.

`metaData.json`
```
{
  "numEmailsSent": 5
}
```

`rootMock.json`
```
{
  "--include metaData.json": "DEFAULTS",
  "--map numEmailsSent": [ 10, 20 ]
}
```

Will result in the mocks:

`rootMock.json` – generated mocks
```
{
  "numEmailsSent": 10
}
```
```
{
  "numEmailsSent": 20
}
```

A map in a file that is included with `PERMUTE` will be combined with identically named maps, AND identically named non-map properties in the root JSON file.

`metaData.json`
```
{
  "--map numEmailsSent": [ 5, 10 ],
  "firstName": "Bob"
}
```

`rootMock.json`
```
{
  "--include metaData.json": "PERMUTE",
  "numEmailsSent": 20,
  "--map firstName": [ "Billy", "Jimmy" ]
}
```

Will result in the mocks:

`rootMock.json` – generated mocks
```
{
  "numEmailsSent": 5,
  "firstName": "Bob"
}
```
```
{
  "numEmailsSent": 10,
  "firstName": "Bob"
}
```
```
{
  "numEmailsSent": 20,
  "firstName": "Bob"
}
```
```
{
  "numEmailsSent": 5,
  "firstName": "Billy"
}
```
```
{
  "numEmailsSent": 10,
  "firstName": "Billy"
}
```
```
{
  "numEmailsSent": 20,
  "firstName": "Billy"
}
```
```
{
  "numEmailsSent": 5,
  "firstName": "Jimmy"
}
```
```
{
  "numEmailsSent": 10,
  "firstName": "Jimmy"
}
```
```
{
  "numEmailsSent": 20,
  "firstName": "Jimmy"
}
```

---
### --comment
---

`--comment` allows you to leave a comment in your mock layout that will be removed from the final compiled output.

`mock_with_comment.json`
```
{
  "numEmailsSent": 20,
  "--comment comm_1": "This is a comment",
  "--map firstName": [ "Billy", "Jimmy" ],
  "--comment comm_a2": "This is another comment"
}
```

will result in the mocks:

`mock_with_comment.json` – generated mocks
```
{
  "numEmailsSent": 20,
  "firstName": "Billy"
}
```
```
{
  "numEmailsSent": 20,
  "firstName": "Jimmy"
}
```

---
### --filename
---

`--filename` allows you to specify a custom filename for outputted mock files. You can use values from the current mock file in the filename. If the naming schema defined would cause multiple mocks with the same filename to be generated, every mock that would have duplicated filenames after the first will be generated with its default (hashed) filename.

`mock_with_filename.json`
```
{
  "--filename": "{page}-page-{locale.language}_{locale.country}",
  "--map page": [ "Home", "Video" ],
  "locale": {
    "--map language": [ "en", "es" ],
    "--map country": [ "US", "MX" ]
  }
}
```

This would generate 2x2x2=**8 mocks** with custom filenames

`mock_with_filename.json` – generated mocks

`Home-page-en_US.json`
```
{
  "page": "Home"
  "locale": {
    "language": "en",
    "country": "US"
  }
}
```

`Home-page-en_MX.json`
```
{
  "page": "Home",
  "locale": {
    "language": "en",
    "country": "MX"
  }
}
```

`Home-page-es_US.json`
```
{
  "page": "Home"
  "locale": {
    "language": "es",
    "country": "US"
  }
}
```

`Home-page-es_MX.json`
```
{
  "page": "Home",
  "locale": {
    "language": "es",
    "country": "MX"
  }
}
```

`Video-page-en_US.json`
```
{
  "page": "Video"
  "locale": {
    "language": "en",
    "country": "US"
  }
}
```

`Video-page-en_MX.json`
```
{
  "page": "Video",
  "locale": {
    "language": "en",
    "country": "MX"
  }
}
```

`Video-page-es_US.json`
```
{
  "page": "Video"
  "locale": {
    "language": "es",
    "country": "US"
  }
}
```

`Video-page-es_MX.json`
```
{
  "page": "Video",
  "locale": {
    "language": "es",
    "country": "MX"
  }
}
```