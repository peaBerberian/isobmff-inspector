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

## API #########################################################################

### `inspectISOBMFF(input)`

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

### `parseBuffer(input)`

```js
import { parseBuffer } from "isobmff-inspector";
```

Synchronously parses an `ArrayBuffer` or TypedArray input and returns:

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

```js
{
  type: "ftyp",
  name: "File Type Box",
  description: "File type and compatibility",
  offset: 0,
  size: 24,
  headerSize: 8,
  sizeField: "size",
  values: [
    {
      key: "major_brand",
      value: "iso6",
      description: "Brand identifier."
    }
  ],
  children: [
    // ParsedBox
  ],
  issues: [
    { severity: "error", message: "..." }
  ]
}
```

`name`, `description`, and `children` are optional. `children` is only present
for parsed container boxes. `issues` is always present and is empty when the
parser detected no problem. `uuid` is only present on `uuid` boxes and contains
the user-defined box UUID as an uppercase hexadecimal string.

`sizeField` indicates how the box declared its size: `"size"` for the normal
32-bit size field, `"largeSize"` for a 64-bit large-size field, or
`"extendsToEnd"` for boxes declared with size `0`.

In the previous example, ``parsed`` will have something like the following
structure:
```js
[ // boxes, in the order they are encountered
  {
    type: "styp", // 4-character box type
    name: "Segment Type Box", // more human-readable name for the box
    offset: 0, // offset from the beginning of the input, in bytes
    size: 24, // size, in bytes
    headerSize: 8, // size of the box header, in bytes
    sizeField: "size", // "size", "largeSize", or "extendsToEnd"
    values: [ // values in the box, in the order they are encountered
      {
        key: "major_brand", // stable key for the value
        value: "iso6" // ...value. Displayable one are JS strings
      },
      {
        key: "minor_version",
        value: 0 // Number values are usually JS Numbers
      },
      {
        key: "compatible_brands",
        value: "iso6, msdh", // here brands are separated by a comma
      }
    ],
    issues: [ // issues detected while parsing this box
      {
        severity: "error",
        message: "Truncated box: declared 24 byte(s), only 20 available."
      }
    ]
  },
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
            value: 0
          }
          {
            key: "flags",
            value: 0
          },
          {
            key: "sequence_number",
            value: 2
          }
        ]
      }
    ]
  }
  // ...
]
```

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
  - avc1
  - avc3
  - avcC
  - btrt
  - co64
  - colr
  - ctts
  - dinf
  - dref
  - edts
  - elst
  - encv
  - esds
  - free
  - frma
  - ftyp
  - hdlr
  - hev1
  - hvc1
  - hvcC
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
  - pasp
  - pdin
  - pssh
  - saio
  - saiz
  - schi
  - schm
  - sdtp
  - sidx
  - sinf
  - skip
  - smhd
  - stbl
  - stco
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
there receive a ``bufferReader`` object.

This object is obtained by giving the box's content as an ``Uint8Array`` to the
``createBufferReader`` function defined and documented in
``src/utils/buffer_reader.js``.
