# isobmff-inspector ############################################################

The ISOBMFF-inspector is a simple module compatible with Node.js and JavaScript
to facilitate ISOBMFF file parsing.

This is most of all useful for debugging purposes.

You can see it working online through the demo page of the [AISOBMFFWVDFBUTFAII
](https://github.com/peaBerberian/AISOBMFFWVDFBUTFAII), available [here
](https://peaberberian.github.io/AISOBMFFWVDFBUTFAII/). AISOBMFFWVDFBUTFAII is
an online ISOBMFF visualizer based on this parser.


## Usage #######################################################################

You can install it through npm:
```sh
npm install isobmff-inspector
```

Then you can directly use the inspector in your JavaScript or Node file:
```js
import inspectISOBMFF from "isobmff-inspector";

const parsed = await inspectISOBMFF(MY_ISOBMFF_FILE);
console.log(parsed);
```

The same entry point can also progressively parse usual byte sources:
```js
import inspectISOBMFF from "isobmff-inspector";

const parsedFile = await inspectISOBMFF(fileInput.files[0]);

const response = await fetch("https://example.com/video.mp4");
const parsedResponse = await inspectISOBMFF(response);
```

The inspector only buffers the bytes it needs to parse a box. Boxes without a
parser or children, including `mdat`, are skipped progressively when their size
is known, so large media payloads do not have to be kept in memory.

If you want parsed metadata as it becomes available, use the event iterator:
```js
import { parseEvents } from "isobmff-inspector";

for await (const event of parseEvents(response)) {
  if (event.event === "box-complete") {
    console.log("box parsed", event.path.join("/"), event.box);
  }
}
```

## Command line ###############################################################

You can also run the inspector directly from npm:

```sh
npx isobmff-inspector myfile.mp4
```

This prints the parsed box tree as formatted JSON.

Use `--format simple` to print a lighter JSON tree intended for quick
inspection:

```sh
npx isobmff-inspector --format simple myfile.mp4
```

The default is `--format full`.

The command reads the input file progressively, so large media payloads do not
have to be loaded fully in memory before parsing. The current output is emitted
once the parse is complete.

## API #########################################################################

### `inspectISOBMFF(input, options)`

```js
import inspectISOBMFF from "isobmff-inspector";
```

Parses an ISOBMFF input.

The same function is also available as a named export:

```js
import { parse } from "isobmff-inspector";
```

Supported inputs:

- `ArrayBuffer`
- any TypedArray, such as `Uint8Array`
- `Blob` or `File`
- `Request` or `Response`
- Web `ReadableStream`
- Node.js readable streams
- sync or async iterables of byte chunks

Return value:

- `Promise<ParsedBox[]>`

Options:

```js
{
  format: "full" // or "simple"
}
```

`"full"` is the default and returns the rich `ParsedBox[]` structure documented
below. `"simple"` returns a `SimpleParsedBox[]` structure with parsed field
values projected to plain JavaScript values for console and CLI inspection.

### `parseBuffer(input, options)`

```js
import { parseBuffer } from "isobmff-inspector";
```

Synchronously parses an `ArrayBuffer` or TypedArray input. It accepts the same
`format` option as `inspectISOBMFF`.

The default return value is:

```js
ParsedBox[]
```

### `parseEvents(input)`

```js
import { parseEvents } from "isobmff-inspector";
```

Progressively parses an ISOBMFF input and yields metadata events as soon as they
are available.

```js
for await (const event of parseEvents(input)) {
  // event.event is "box-start" or "box-complete"
}
```

Events:

```js
{
  event: "box-start",
  path: ["moov", "trak"],
  type: "tkhd",
  offset: 140,
  size: 92,
  headerSize: 8,
  sizeField: "size"
}
```

```js
{
  event: "box-complete",
  path: ["ftyp"],
  box: ParsedBox
}
```

### `ParsedBox`

The parsed result is an array of boxes, in the order they are encountered.

In the previous example, ``parsed`` will have something like the following
structure:
```js
[ // boxes, in the order they are encountered

  // A simple parsed styp leaf box at the root:
  {
    type: "styp", // 4-character box type
    name: "Segment Type Box", // Optional. More human-readable name for the box
    offset: 0, // offset from the beginning of the input, in bytes
    size: 24, // size, in bytes
    headerSize: 8, // size of the box header, in bytes

    // Optional box human-readable description
    description: "Identifies the brands and compatibility of a media segment.",

    // indicates how the box declared its size: `"size"` for the normal
    // 32-bit size field, `"largeSize"` for a 64-bit large-size field, or
    // `"extendsToEnd"` for boxes declared with size `0`.
    sizeField: "size",

    // values in the box, in the order they are encountered
    values: [
      {
        key: "major_brand", // stable key for the value
        kind: "string", // kind of parsed field
        value: "iso6" // ...value. Displayable one are JS strings
      },
      {
        key: "minor_version",
        kind: "number",
        value: 0 // Number values are usually JS Numbers
      },
      {
        key: "compatible_brands",
        kind: "string",
        value: "iso6, msdh", // here brands are separated by a comma
      }
    ],

    issues: [ // issues detected while parsing this box. Empty for no issue
      {
        severity: "error",
        message: "Truncated box: declared 24 byte(s), only 20 available."
      }
    ]
  },

  // Another example for a container box: it has a `children` key but no `values`:
  {
    type: "moof",
    name: "Movie Fragment Box",
    size: 788,
    children: [ // children boxes, in the order they are encountered
      {
        type: "mfhd",
        name: "Movie Fragment Header Box",
        values: [
          {
            key: "version",
            kind: "number",
            value: 0
          },
          {
            key: "flags",
            kind: "number",
            value: 0
          },
          {
            key: "sequence_number",
            kind: "number",
            value: 2
          }
        ]
      }
    ]
  }
  // ...
]
```

An `uuid` property is also present only on `uuid` boxes and contains
the user-defined box UUID as an uppercase hexadecimal string.

When possible, the inspector keeps parsing after an error to return as much
information as it can. Parsing issues are reported on the corresponding box
through an ``issues`` array.

Each issue entry has:

- ``severity``: either ``"warning"`` or ``"error"``
- ``message``: a human-readable description of the issue

``severity: "error"`` means the inspector could not reliably parse part of the
file, for example because a box is truncated, has an invalid size, or a field
could not be read. ``severity: "warning"`` means parsing could continue, but the
parsed result may be incomplete or suspicious, for example when a known box
parser left unread bytes.

### Field values

Each parsed field in `ParsedBox.values` has a stable `key`, a `kind`, and
kind-specific data. `description` is optional and is present when the parser has
extra human-readable context for that field.

Most scalar fields follow this shape:

```js
{
  key: "sequence_number",
  kind: "number",
  value: 2,
  description: "Movie fragment sequence number." // Optional
}
```

Applications should switch on `kind` when reading fields:

- `number`: Used for 8-bit to 32-bit integer fields.
  `value` is a JavaScript `number`.
- `bigint`: Used for 64-bit integer fields.
  `value` is a JavaScript `bigint`.
- `string`: Used for string fields, hexadecimal fields, and derived display
   strings.
  `value` is a JavaScript `string`.
- `boolean`: `value` is a JavaScript boolean.
- `null`: `value` is a parsed null value.
- `fixed-point`: For most ISOBMFF floating numbers.
  `value` is a JavaScript `number`.
  More advanced info is also available (described below).
- `date`: For what are semantically dates.
  `value` is either a `number` or `bigint` depending on its size.
  More advanced info is also available (described below).
- `bits`: a packed integer split into named bit ranges.
  `value` is a JavaScript `number`.
  More advanced info is also available (described below).
- `flags`: a packed integer interpreted as named boolean flags.
  `value` is a JavaScript `number`.
  More advanced info is also available (described below).
- `array`: an ordered list of parsed fields.
  This list is in an `items` array property. It has no `value` property.
  More advanced info is also available (described below).
- `struct`: a named group of parsed fields.
  Those fields are defined in a `fields` array property.
  It has no `value` property.
  More advanced info is also available (described below).

For a very simple exploitation, you can thus just read the `value` property of
all of those but `array` (which relies on an `items` array of further field
values objects) and `struct` (similar, but they rely on a `fields` array).

For more advanced usages, you can read below.

#### `fixed-point`

`fixed-point` fields corresponds to cases where the ISOBMFF format encodes fixed
point numbers explicitly (which is often preferred by this format instead of
less precize IEEE 754 float values like `number` in JavaScript).
It exposes the decoded number through `value`, plus the raw integer and its
declared format:

```js
{
  key: "horizontal_resolution",
  kind: "fixed-point",
  value: 72,
  raw: 4718592,
  format: "16.16",
  signed: false,
  bits: 32
}
```

The `bits` property is the size of the raw fixed-point integer before fractional scaling.

#### `date`

`date` fields corresponds to ISOBMFF properties encoding a date.
As a `value` they expose the raw ISOBMFF value (a timestamp, /!\ they generally do not
rely on the unix epoch, the ISO-8601 epoch is given through the `epoch` property instead)
and, when it can be represented by JavaScript's `Date`, an ISO-8601 string:

```js
{
  key: "creation_time",
  kind: "date",
  value: 3846096077n,
  date: "2025-11-21T09:21:17.000Z",
  epoch: "1904-01-01T00:00:00.000Z",
  unit: "seconds"
}
```

`date` is `null` when the corresponding Unix timestamp cannot be converted to a
finite, valid JavaScript `Date`. For `bigint` values, this also happens when the
timestamp is outside JavaScript's safe integer range.

#### `bits`

`bits` fields keep the original integer in `raw` and describe each named
sub-field in `fields`. `value` is a convenience for minimal consumers: it is the
most meaningful decoded value when the parser identifies one, or the raw integer
otherwise. Consumers that need precise bit-level meaning should read `fields`.

```js
{
  key: "lengthSizeMinusOne",
  kind: "bits",
  value: 3,
  raw: 255,
  bits: 8,
  fields: [
    { key: "reserved", value: 63, bits: 6, shift: 2, mask: 252 },
    { key: "value", value: 3, bits: 2, shift: 0, mask: 3 }
  ]
}
```

#### `flags`

`flags` fields keep the original integer in both `value` and `raw`, then expose
the named flags as booleans:

```js
{
  key: "flags",
  kind: "flags",
  value: 131072,
  raw: 131072,
  bits: 24,
  flags: [
    { key: "default-base-is-moof", value: true, mask: 131072 }
  ]
}
```

#### `array` and `struct`

`array` and `struct` fields are recursive. Array `items` contain parsed fields
without a `key`; struct `fields` contain normal keyed `ParsedBoxValue` entries.

For example, an array of AVC parameter-set objects is represented as an array of
struct fields:

```js
{
  key: "sequenceParameterSets",
  kind: "array",
  items: [
    {
      kind: "struct",
      fields: [
        { key: "length", kind: "number", value: 24 },
        { key: "data", kind: "string", value: "6742c00d..." }
      ]
    }
  ]
}
```

A struct may also expose a `layout` hint when the parser knows how the fields
should be displayed. Current layout values are:

- `"matrix-3x3"`: a 3 by 3 transformation matrix.
- `"iso-639-2-t"`: an ISO 639-2/T language code plus its packed raw value.
- `"cenc-pattern"`: Common Encryption crypt/skip byte-block pattern fields.

```js
{
  key: "matrix",
  kind: "struct",
  layout: "matrix-3x3",
  fields: [
    {
      key: "a",
      kind: "fixed-point",
      value: 1,
      raw: 65536,
      format: "16.16",
      signed: true,
      bits: 32
    }
  ]
}
```

### Simple format

The `"simple"` format keeps box-level metadata but replaces `values` with a
plain `fields` object:

```js
const parsed = await inspectISOBMFF(input, { format: "simple" });
```

```js
{
  type: "ftyp",
  offset: 0,
  size: 24,
  headerSize: 8,
  sizeField: "size",
  fields: {
    major_brand: "iso6",
    minor_version: 0,
    compatible_brands: "iso6, msdh"
  }
}
```

Simple boxes use the following shape:

```js
{
  type: "moov",
  offset: 24,
  size: 1024,
  headerSize: 8,
  sizeField: "size",
  uuid: "001122...", // only for uuid boxes
  fields: {},
  children: [
    // SimpleParsedBox
  ],
  issues: [
    // only present when non-empty
  ]
}
```

Field keys are kept unchanged. Packed `bits` and `flags` fields become plain
objects containing the decoded named entries plus the original integer in
`$raw`:

```js
{
  fields: {
    lengthSizeMinusOne: {
      $raw: 255,
      reserved: 63,
      value: 3
    },
    flags: {
      $raw: 131072,
      "default-base-is-moof": true
    }
  }
}
```

`fixed-point` fields become their decoded number. `date` fields become their
ISO-8601 string when available, otherwise their raw value. `array` and `struct`
fields are recursively simplified.

## Integer types ###############################################################

Parsed integer values follow a fixed rule:

- 8-bit to 32-bit integers are returned as JavaScript ``number`` values
- 64-bit integers are returned as JavaScript ``bigint`` values

This means 64-bit ISOBMFF fields are always exact and never depend on the
parsed value's magnitude.

Though this also means that applications will have to check for `bigint` when
handling numeric values, as those are mostly incompatible with `number` values.

## Parsed boxes ################################################################

The inspector only parses the following ISOBMFF boxes for now:
  - ac-3
  - av01
  - avc1
  - avc3
  - avcC
  - btrt
  - co64
  - colr
  - cslg
  - ctts
  - dac3
  - dec3
  - dOps
  - dinf
  - dref
  - ec-3
  - edts
  - elng
  - elst
  - emsg
  - enca
  - encv
  - esds
  - free
  - frma
  - ftyp
  - hdlr
  - hev1
  - hvc1
  - hvcC
  - keys
  - ID32
  - ilst
  - iods
  - leva
  - mdat
  - mdhd
  - mdia
  - mehd
  - meta
  - mfhd
  - minf
  - moof
  - moov
  - mp4a
  - mvex
  - mvhd
  - nmhd
  - Opus
  - pasp
  - pdin
  - prft
  - pssh
  - saio
  - saiz
  - sbgp
  - schi
  - schm
  - sdtp
  - senc
  - sgpd
  - sidx
  - sinf
  - skip
  - smhd
  - stbl
  - stco
  - sthd
  - stsc
  - stsd
  - stss
  - stsz
  - stts
  - styp
  - tenc
  - tfdt
  - tfhd
  - tkhd
  - traf
  - trak
  - trep
  - trex
  - trun
  - udta
  - url 
  - urn 
  - uuid
  - vmhd

I plan to support each one of them but UUIDs (I may add support for some of them
in the future, for example for Smooth Streaming ones).


## Contribute ##################################################################

You can help me to add parsing logic for other boxes by updating the
``src/boxes`` directory.

You can base yourself on already-defined boxes. Each of the ``parser`` functions
there receive a ``BoxReader`` object.
They can parse the associated box either:

- By "reading" the box (with the given `BoxReader` e.g. though
  `reader.readUint(4)`) and ultimately returning an object from that ``parser``
  function, whose keys are in the same order than the fields in the source
  ISOBMFF, where each key corresponds to a different box field, and whose value
  is the corresponding parsed value in the most expected format (e.g. `number`
  for integers, `string` for ASCII/UTF-8 etc.)

- Or by declaring directly all fields with the given `BoxReader` without having
  to return any object.

  This can e.g. be done through a method like
  `reader.fieldUint("version", 1, "The box version")` and allows to also provide
  a description for the field.

Note that each of those call advance the `BoxReader`'s internal cursor so
consecutive calls will progress through the file.
