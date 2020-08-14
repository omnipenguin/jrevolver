# What is jRevolver?

A robust app for generating mock JSON for testing purposes

# Intent

To build a flexible and robust mock data generation tool that can be easily be plugged into many different testing pipelines across multiple teams.
Engineering needs

jRevolver gives engineers a way to:

    Combine JSON files – includes files within other files
    Define multiple possible values for a single JSON key
    Automatically generate mock JSON, respecting all value permutations for multiple keys
    Define a exclude list for specific key/value combinations
    Define a allow list for specific key/value combinations
    Other useful features such as comments and control over outputted mock filenames

## Examples

### --map

--map allows you assign many different values to a single property, generating a permutation for each discrete value.

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

#### Current context maps

You can use a --map with no property name to permute the values inside within the current JSON context (instead of on a new property)

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
  "baryons": "209",
  "weight": 100
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
      "numberOfGrams": 343,
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
      "price": "--getMapKey dollars"
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

#### --mapContent: exclude and allow lists with non-object values

In order to exclude or allow a permutation for a map where the value is a non-primitive type, it must have a --mapKey property. But what if you want to filter a value that is an Array, or another non-Object that is also not a JSON primitive type? --mapContent allows you to do this:

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

This out output the mocks:

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
  "metal": "Iridium",
  "endsUpAnArray": [
    1,
    2,
    77
  ]
}
```

The value of the --mapContent property (the array) becomes the value of endsUpAnArray (for that permutation). We are also excluding the permutation indexed by --mapKey "ggH"

### --include

--include allows you to combine multiple JSON files

#### Simple Use

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

Simple use, with overridden values

`include_simple_use_overrides.json`
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

`include_simple_use_overrides.json` – generated mocks
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

Notice how numEmailsSent has been overridden.

#### Simple use, permutations with overridden values

`include_simple_use_override_and_permute.json`
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

`include_simple_use_override_and_permute.json` – generated mocks
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

You could also use a --map on numEmailsSent to generate even more permutations

### Other useful information

A map in a file that is included with "DEFAULTS" will be overridden by an identically named non-map property in the root JSON file

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

A property in file that is included with "DEFAULTS" will be overridden by an identically named map in the root JSON file

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

A map in a file that is included with "PERMUTE" will be combined with identically named maps, AND identically named non-map properties in the root JSON file

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

### --comment

--comment allows you to leave a comment in your mock layout that will be removed from the final compiled output.

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

### --filename

--filename allows you to specify a custom filename for outputted mock files. You can use values from the current mock file in the filename. If the naming schema defined would cause multiple mocks with the same filename to be generated, every mock that would have duplicated filenames after the first will be generated with its default (hashed) filename.

`mock_with_filename.json`
```
{
  "--filename": "{page}-page-{locale.language}_{locale.country}",
  "--map page": [ "Home", "Course" ],
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

`Course-page-en_US.json`
```
{
  "page": "Course"
  "locale": {
    "language": "en",
    "country": "US"
  }
}
```

`Course-page-en_MX.json`
```
{
  "page": "Course",
  "locale": {
    "language": "en",
    "country": "MX"
  }
}
```

`Course-page-es_US.json`
```
{
  "page": "Course"
  "locale": {
    "language": "es",
    "country": "US"
  }
}
```

`Course-page-es_MX.json`
```
{
  "page": "Course",
  "locale": {
    "language": "es",
    "country": "MX"
  }
}
```